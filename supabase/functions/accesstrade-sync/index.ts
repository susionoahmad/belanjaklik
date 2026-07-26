// supabase/functions/accesstrade-sync/index.ts
//
// Sinkronisasi katalog produk affiliate dari Accesstrade ke tabel `affiliate_products`.
//
// Cara pakai:
//   1. Set secrets (lihat README.md di folder ini)
//   2. Deploy: supabase functions deploy accesstrade-sync
//   3. Panggil manual: curl -X POST https://<project>.supabase.co/functions/v1/accesstrade-sync \
//        -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
//   4. (Opsional) Jadwalkan lewat Supabase Cron / pg_cron supaya jalan otomatis tiap beberapa jam.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ACCESSTRADE_BASE = 'https://gurkha.accesstrade.global'

interface CampaignConfig {
  merchant: string // 'shopee' | 'tiktok_shop' | 'tokopedia' | dst
  campaignId: string
}

// Daftar campaign yang mau disync. Ambil campaignId dari dashboard Accesstrade
// (Direktori Campaign > buka campaign yang sudah di-approve).
// Bisa juga di-override lewat env ACCESSTRADE_CAMPAIGNS berisi JSON array.
function getCampaigns(): CampaignConfig[] {
  const fromEnv = Deno.env.get('ACCESSTRADE_CAMPAIGNS')
  if (fromEnv) {
    try {
      return JSON.parse(fromEnv)
    } catch {
      console.error('ACCESSTRADE_CAMPAIGNS bukan JSON valid, pakai default kosong')
    }
  }
  return []
}

// ---- JWT (HS256) signing pakai Web Crypto, tanpa dependency tambahan ----
function base64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function signJwt(userUid: string, secretKey: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = { sub: userUid, iat: Math.floor(Date.now() / 1000) }

  const encodedHeader = base64url(JSON.stringify(header))
  const encodedPayload = base64url(JSON.stringify(payload))
  const signingInput = `${encodedHeader}.${encodedPayload}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))
  return `${signingInput}.${base64url(signature)}`
}

// ---- Ambil URL feed dari Accesstrade untuk 1 campaign ----
async function getProductFeedUrl(
  jwt: string,
  siteId: string,
  campaignId: string
): Promise<string> {
  const res = await fetch(
    `${ACCESSTRADE_BASE}/v1/publishers/me/sites/${siteId}/campaigns/${campaignId}/productfeed/url?countryCode=ID`,
    { headers: { Authorization: `Bearer ${jwt}` } }
  )
  if (!res.ok) {
    throw new Error(`Gagal ambil feed URL untuk campaign ${campaignId}: ${res.status} ${await res.text()}`)
  }
  const data = await res.json()
  return data.baseUrl
}

// ---- Generator Slug Unik untuk URL /produk/[slug] ----
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function generateSlug(name: string, externalId?: string | null): string {
  const base = slugify(name) || 'produk'
  const cleanExtId = externalId ? slugify(String(externalId)).replace(/-/g, '').slice(-6) : ''
  const suffix = cleanExtId || Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}

// ---- Normalisasi 1 item dari feed Accesstrade ke bentuk affiliate_products ----
// CATATAN: field di bawah ini adalah dugaan berdasarkan konvensi umum Accesstrade.
// Setelah kamu lihat isi feed asli (fetch baseUrl-nya sekali secara manual),
// SESUAIKAN mapping ini dengan nama field yang benar-benar dikembalikan.
function mapFeedItem(item: any, merchant: string, campaignId: string) {
  const extId = String(item.id ?? item.product_id ?? item.sku ?? '')
  const productName = item.name ?? item.title ?? 'Produk tanpa nama'

  return {
    source: 'accesstrade',
    merchant,
    campaign_id: campaignId,
    external_product_id: extId,
    name: productName,
    slug: generateSlug(productName, extId),
    description: item.description ?? null,
    image_url: item.image ?? item.image_url ?? item.thumbnail ?? null,
    product_url: item.url ?? item.product_url ?? null,
    affiliate_url: item.aff_link ?? item.affiliate_url ?? item.url ?? '',
    price: item.price ?? item.sale_price ?? null,
    original_price: item.original_price ?? item.list_price ?? null,
    discount_percent: item.discount ?? item.discount_percent ?? null,
    commission_rate: item.commission ?? item.commission_rate ?? null,
    shop_name: item.shop_name ?? item.merchant_name ?? null,
    category: item.category ?? null,
    is_active: true,
    raw_data: item,
    last_synced_at: new Date().toISOString(),
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Gunakan POST untuk memicu sync', { status: 405 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const userUid = Deno.env.get('ACCESSTRADE_USER_UID')!
  const secretKey = Deno.env.get('ACCESSTRADE_SECRET_KEY')!
  const siteId = Deno.env.get('ACCESSTRADE_SITE_ID')!
  const campaigns = getCampaigns()

  if (!userUid || !secretKey || !siteId) {
    return new Response(
      JSON.stringify({ error: 'Secrets ACCESSTRADE_USER_UID / SECRET_KEY / SITE_ID belum diset' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
  if (campaigns.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Belum ada campaign dikonfigurasi di ACCESSTRADE_CAMPAIGNS' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const jwt = await signJwt(userUid, secretKey)
  const results: Record<string, unknown>[] = []
  let totalSynced = 0

  for (const { merchant, campaignId } of campaigns) {
    try {
      const feedUrl = await getProductFeedUrl(jwt, siteId, campaignId)
      const feedRes = await fetch(feedUrl)
      if (!feedRes.ok) throw new Error(`Feed fetch gagal: ${feedRes.status}`)

      const feedData = await feedRes.json()
      // Feed biasanya berupa array langsung, atau { data: [...] } / { products: [...] }
      const items: any[] = Array.isArray(feedData)
        ? feedData
        : feedData.data ?? feedData.products ?? []

      const rows = items.map((item) => mapFeedItem(item, merchant, campaignId))

      if (rows.length > 0) {
        const { error } = await supabase
          .from('affiliate_products')
          .upsert(rows, { onConflict: 'merchant,campaign_id,external_product_id' })
        if (error) throw error
      }

      await supabase.from('affiliate_sync_logs').insert({
        merchant,
        campaign_id: campaignId,
        status: 'success',
        products_synced: rows.length,
      })

      totalSynced += rows.length
      results.push({ merchant, campaignId, synced: rows.length })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await supabase.from('affiliate_sync_logs').insert({
        merchant,
        campaign_id: campaignId,
        status: 'error',
        error_message: message,
      })
      results.push({ merchant, campaignId, error: message })
    }
  }

  // Trigger Vercel deploy hook jika ada produk baru/di-update
  const deployHookUrl = Deno.env.get('VERCEL_DEPLOY_HOOK_URL')
  if (deployHookUrl && totalSynced > 0) {
    try {
      await fetch(deployHookUrl, { method: 'POST' })
      console.log(`Vercel deploy hook triggered (synced ${totalSynced} products)`)
    } catch (deployErr) {
      console.error('Gagal memicu Vercel deploy hook:', deployErr)
    }
  }

  return new Response(JSON.stringify({ results, totalSynced }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
