// supabase/functions/accesstrade-sync/index.ts
//
// Sinkronisasi katalog produk affiliate dari Accesstrade ke tabel `affiliate_products`.
//
// Fitur & Perbaikan Utama:
//   1. Header `X-Accesstrade-User-Type: publisher` ditambahkan di semua request API Accesstrade.
//   2. Domain base API dapat dikonfigurasi via env `ACCESSTRADE_BASE_URL` (default: https://gurkha.accesstrade.co.id).
//   3. Mendukung response array maupun object tunggal pada endpoint `productfeed/url`.
//   4. Mode Debug (?debug=true / Header X-Debug: true) untuk inspeksi response mentah API secara live.
//   5. Parsing CSV otomatis & mapping kolom feed Accesstrade asli.
//   6. Pembersihan judul (hapus tag bracket, keyword stuffing, potong max 90 karakter) & pembersihan deskripsi.
//   7. Pengaman database: filter `Available == true`, threshold `item_sold` (ACCESSTRADE_MIN_ITEM_SOLD, default: 10),
//      batch insert per 500 baris, & hard limit total produk per sync (ACCESSTRADE_MAX_PRODUCTS_PER_SYNC, default: 5000).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ACCESSTRADE_BASE = Deno.env.get('ACCESSTRADE_BASE_URL') || 'https://gurkha.accesstrade.co.id'

interface CampaignConfig {
  merchant: string // 'shopee' | 'tiktok_shop' | 'tokopedia' | dst
  campaignId: string
}

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

// ---- JWT (HS256) signing via Web Crypto API ----
function base64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function signJwt(userUid: string, secretKey: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = { 
    sub: userUid, 
    user_type: 'publisher',
    userType: 'publisher',
    role: 'publisher',
    iat: Math.floor(Date.now() / 1000) 
  }

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

interface ProductFeedUrlItem {
  creativeId?: number | string
  baseUrl: string
  name?: string
  description?: string
  updatedTime?: string
}

// ---- Ambil URL feed dari Accesstrade (Mendukung Array & Object tunggal) ----
async function getProductFeedUrls(
  jwt: string,
  siteId: string,
  campaignId: string
): Promise<{ rawStatus: number; rawData: any; feedUrls: ProductFeedUrlItem[]; testedEndpoints?: any[] }> {
  const candidateUrls = [
    `${ACCESSTRADE_BASE}/v1/publishers/me/sites/${siteId}/campaigns/${campaignId}/productfeed/url?countryCode=ID`,
    `${ACCESSTRADE_BASE}/v1/publishers/me/sites/${siteId}/campaigns/${campaignId}/productfeed/url?countryCode=id`,
    `${ACCESSTRADE_BASE}/v1/publishers/me/sites/${siteId}/campaigns/${campaignId}/productfeed/url`,
    `${ACCESSTRADE_BASE}/v1/publishers/me/sites/${siteId}/campaigns/${campaignId}/productfeed`,
    `${ACCESSTRADE_BASE}/v1/publishers/me/sites/${siteId}/campaigns/${campaignId}/productfeeds`,
    `${ACCESSTRADE_BASE}/v1/publishers/me/sites/${siteId}/campaigns/${campaignId}/datafeed`,
    `${ACCESSTRADE_BASE}/v1/campaigns/${campaignId}/productfeed/url?siteId=${siteId}`,
    `${ACCESSTRADE_BASE}/v1/campaigns/${campaignId}/productfeed?siteId=${siteId}`,
    `https://gurkha.accesstrade.global/v1/publishers/me/sites/${siteId}/campaigns/${campaignId}/productfeed/url?countryCode=ID`,
  ]

  const testedEndpoints: any[] = []

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'X-Accesstrade-User-Type': 'publisher',
          'x-accesstrade-user-type': 'publisher',
          'X-User-Type': 'publisher',
          'x-user-type': 'publisher',
          'User-Type': 'publisher',
        },
      })
      const text = await res.text()
      let parsedData: any = null
      try {
        parsedData = JSON.parse(text)
      } catch {
        parsedData = text
      }

      testedEndpoints.push({
        url,
        status: res.status,
        response: parsedData,
      })

      if (res.ok) {
        const feedUrls: ProductFeedUrlItem[] = []
        if (Array.isArray(parsedData)) {
          for (const item of parsedData) {
            if (item && item.baseUrl) feedUrls.push(item)
          }
        } else if (parsedData && typeof parsedData === 'object') {
          if (Array.isArray(parsedData.data)) {
            for (const item of parsedData.data) {
              if (item && item.baseUrl) feedUrls.push(item)
            }
          } else if (parsedData.baseUrl) {
            feedUrls.push(parsedData)
          }
        }

        if (feedUrls.length > 0) {
          return { rawStatus: res.status, rawData: parsedData, feedUrls, testedEndpoints }
        }
      }
    } catch (err) {
      testedEndpoints.push({
        url,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const lastTest = testedEndpoints[0] || {}
  return {
    rawStatus: lastTest.status || 404,
    rawData: lastTest.response || 'Tiga endpoint kandidat mengembalikan 404',
    feedUrls: [],
    testedEndpoints,
  }
}

// ---- Pembersihan & Pengolahan Teks ----
function cleanProductName(title: string): string {
  if (!title || typeof title !== 'string') return ''
  let str = title.trim()
  str = str.replace(/^(\[[^\]]+\]\s*)+/gi, '')
  const parts = str.split('|').map((p) => p.trim()).filter(Boolean)
  if (parts.length > 0) str = parts[0]
  const slashParts = str.split(' / ').map((p) => p.trim()).filter(Boolean)
  if (slashParts.length > 1 && slashParts[0].length >= 15) str = slashParts[0]
  str = str.replace(/\s+/g, ' ').trim()
  if (str.length > 90) {
    str = str.substring(0, 90).replace(/\s+\S*$/, '').trim()
  }
  return str
}

function cleanProductDescription(text: string): string {
  if (!text || typeof text !== 'string') return ''
  let str = text
  str = str.replace(/<br\s*\/?>|<\/p>|<\/div>/gi, '\n')
  str = str.replace(/<[^>]+>/g, '')
  str = str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
  const lines = str.split('\n')
  const cleanedLines: string[] = []
  for (const line of lines) {
    const l = line.trim()
    if (!l) continue
    if (/#(?:[a-zA-Z0-9_]+)/.test(l)) continue
    if (/(unboxing|reseller|order sekarang|buka toko|jam operasional|syarat & ketentuan|disclaimer|wajib video|garansi retur|pembelian grosir)/i.test(l)) continue
    cleanedLines.push(l)
  }
  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function generateSlug(name: string, externalId?: string | null): string {
  let base = slugify(name) || 'produk'
  if (base.length > 70) base = base.substring(0, 70).replace(/-+$/, '')
  const cleanExtId = externalId ? slugify(String(externalId)).replace(/-/g, '').slice(-6) : ''
  const suffix = cleanExtId || Math.random().toString(36).substring(2, 8)
  const slug = `${base}-${suffix}`
  return slug.length > 90 ? slug.substring(0, 90).replace(/-+$/, '') : slug
}

function parseNumeric(val: any): number | null {
  if (val === undefined || val === null || val === '') return null
  if (typeof val === 'number') return isNaN(val) ? null : val
  let str = String(val).trim().replace(/Rp\s*|\$/gi, '')
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.')
    } else {
      str = str.replace(/,/g, '')
    }
  } else if (str.includes('.') && !str.includes(',')) {
    const parts = str.split('.')
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/\./g, '')
    }
  } else if (str.includes(',') && !str.includes('.')) {
    str = str.replace(',', '.')
  }
  const num = parseFloat(str)
  return isNaN(num) ? null : num
}

// ---- Parser CSV Sederhana & Andal ----
function parseCsv(text: string): Record<string, string>[] {
  const lines: string[] = []
  let currentLine = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        currentLine += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i++
      if (currentLine.trim()) lines.push(currentLine)
      currentLine = ''
    } else {
      currentLine += char
    }
  }
  if (currentLine.trim()) lines.push(currentLine)

  if (lines.length < 2) return []

  const parseRow = (line: string): string[] => {
    const cells: string[] = []
    let cell = ''
    let inside = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        if (inside && line[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inside = !inside
        }
      } else if (c === ',' && !inside) {
        cells.push(cell.trim())
        cell = ''
      } else {
        cell += c
      }
    }
    cells.push(cell.trim())
    return cells
  }

  const headers = parseRow(lines[0])
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i])
    if (values.length === 0 || (values.length === 1 && !values[0])) continue
    const rowObj: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      rowObj[headers[j]] = values[j] !== undefined ? values[j] : ''
    }
    rows.push(rowObj)
  }

  return rows
}

// ---- Mapping Baris CSV ke Objek affiliate_products ----
function mapCsvRowToProduct(
  row: Record<string, string>,
  merchant: string,
  campaignId: string
) {
  const extId = String(
    row['Merchant Product ID'] || row['Merchant_Product_ID'] || row['id'] || row['product_id'] || ''
  ).trim()
  const rawName = row['Merchant Product Name'] || row['name'] || row['title'] || 'Produk Afiliasi'
  const cleanedName = cleanProductName(rawName)
  const productUrl =
    row['Product URL Web (encoded)'] ||
    row['Product URL Mobile (encoded)'] ||
    row['Product URL'] ||
    row['product_url'] ||
    ''
  const affiliateUrl =
    row['Product URL Web (encoded)'] ||
    row['Product URL Mobile (encoded)'] ||
    row['affiliate_url'] ||
    productUrl
  const imageUrl = row['Image URL'] || row['image_url'] || row['Image URL Additional'] || ''
  const rawDesc = row['Description'] || row['description'] || ''
  const cleanedDesc = cleanProductDescription(rawDesc)

  const normalPrice = parseNumeric(row['Price'] || row['price'] || row['original_price'])
  const promoPrice = parseNumeric(row['Discounted Price'] || row['discounted_price'] || row['sale_price'])

  const finalPrice = promoPrice && promoPrice > 0 ? promoPrice : (normalPrice || 0)
  const originalPrice = normalPrice && normalPrice > finalPrice ? normalPrice : null

  let discountPercent: number | null = null
  if (originalPrice && finalPrice && originalPrice > finalPrice) {
    discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
  }

  const category =
    row['Sub category Name'] || row['Category Name'] || row['Main Category Name'] || row['category'] || ''
  const shopName = row['Brand'] || row['Merchant Name'] || row['shop_name'] || ''
  const itemSold = parseNumeric(row['item_sold']) || 0
  const itemRating = parseNumeric(row['item_rating'])

  const now = new Date().toISOString()

  return {
    source: 'accesstrade',
    merchant,
    campaign_id: campaignId,
    external_product_id: extId || null,
    name: cleanedName,
    slug: generateSlug(cleanedName, extId),
    description: cleanedDesc || null,
    image_url: imageUrl || null,
    product_url: productUrl || null,
    affiliate_url: affiliateUrl,
    price: finalPrice,
    original_price: originalPrice,
    discount_percent: discountPercent,
    shop_name: shopName || null,
    category: category || null,
    is_active: true,
    raw_data: {
      item_sold: itemSold,
      item_rating: itemRating,
      master_product_id: row['Master Product ID'] || null,
      master_product_name: row['Master Product Name'] || null,
    },
    last_synced_at: now,
  }
}

// ---- Main Handler ----
Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Gunakan POST atau GET untuk memicu sync', { status: 405 })
  }

  const urlObj = new URL(req.url)
  let requestBody: any = {}
  if (req.method === 'POST') {
    try {
      requestBody = await req.json()
    } catch {
      requestBody = {}
    }
  }

  // Cek parameter mode Debug
  const isDebug =
    urlObj.searchParams.get('debug') === 'true' ||
    req.headers.get('x-debug') === 'true' ||
    requestBody.debug === true

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

  // ---- MODE DEBUG: Inspeksi Response Mentah Accesstrade API ----
  if (isDebug) {
    try {
      const jwt = await signJwt(userUid, secretKey)
      const customUrl = requestBody.customUrl || urlObj.searchParams.get('customUrl')
      const isListCampaigns = urlObj.searchParams.get('listCampaigns') === 'true' || requestBody.listCampaigns === true

      if (isListCampaigns) {
        const campaignsList: any[] = []
        const totalPagesToScan = 5

        for (let page = 1; page <= totalPagesToScan; page++) {
          const epUrl = `${ACCESSTRADE_BASE}/v1/campaigns?siteId=${siteId}&limit=50&page=${page}`
          try {
            const probeRes = await fetch(epUrl, {
              headers: {
                'Authorization': `Bearer ${jwt}`,
                'X-Accesstrade-User-Type': 'publisher',
                'x-accesstrade-user-type': 'publisher',
                'X-User-Type': 'publisher',
                'x-user-type': 'publisher',
                'User-Type': 'publisher',
              },
            })
            if (!probeRes.ok) break
            const resData = await probeRes.json()
            let items: any[] = []
            if (Array.isArray(resData)) {
              items = resData
            } else if (resData && Array.isArray(resData.data)) {
              items = resData.data
            } else if (resData && typeof resData === 'object') {
              for (const k of Object.keys(resData)) {
                if (Array.isArray(resData[k])) {
                  items = resData[k]
                  break
                }
              }
            }

            if (!items || items.length === 0) break

            for (const c of items) {
              if (c && c.id) {
                campaignsList.push({
                  campaignId: c.id,
                  name: c.name,
                  status: c.affiliationStatus,
                  productFeedAvailable: c.productFeedAvailable,
                })
              }
            }
          } catch {
            break
          }
        }

        const approvedOrJoined = campaignsList.filter(
          (c) => c.status === 'ACCEPTED' || c.status === 'JOINED' || c.status === 'APPROVED' || c.productFeedAvailable
        )

        return new Response(
          JSON.stringify(
            {
              debug: true,
              mode: 'campaign_finder',
              siteId,
              totalScanned: campaignsList.length,
              joinedOrApprovedCount: approvedOrJoined.length,
              recommendedCampaigns: approvedOrJoined,
              allCampaignsSample: campaignsList.slice(0, 30),
            },
            null,
            2
          ),
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (customUrl) {
        console.log(`[DebugMode] Probing customUrl: ${customUrl}`)
        const probeRes = await fetch(customUrl, {
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'X-Accesstrade-User-Type': 'publisher',
            'x-accesstrade-user-type': 'publisher',
            'X-User-Type': 'publisher',
            'x-user-type': 'publisher',
            'User-Type': 'publisher',
          },
        })
        const probeText = await probeRes.text()
        let probeData: any = null
        try {
          probeData = JSON.parse(probeText)
        } catch {
          probeData = probeText
        }

        return new Response(
          JSON.stringify(
            {
              debug: true,
              mode: 'customUrl_probe',
              customUrl,
              rawStatus: probeRes.status,
              rawResponseBody: probeData,
            },
            null,
            2
          ),
          { headers: { 'Content-Type': 'application/json' } }
        )
      }

      const targetCampaignId = requestBody.campaignId || urlObj.searchParams.get('campaignId') || (campaigns[0]?.campaignId ?? '966')
      const debugInfo = await getProductFeedUrls(jwt, siteId, targetCampaignId)

      return new Response(
        JSON.stringify(
          {
            debug: true,
            message: 'Mode Debug Aktif. Menampilkan response mentah dari Accesstrade API.',
            config: {
              accesstrade_base_url: ACCESSTRADE_BASE,
              userUid,
              siteId,
              targetCampaignId,
            },
            rawStatus: debugInfo.rawStatus,
            rawResponseBody: debugInfo.rawData,
            extractedFeedUrls: debugInfo.feedUrls,
            testedEndpoints: debugInfo.testedEndpoints,
          },
          null,
          2
        ),
        { headers: { 'Content-Type': 'application/json' } }
      )
    } catch (debugErr) {
      const msg = debugErr instanceof Error ? debugErr.message : String(debugErr)
      return new Response(
        JSON.stringify({ debug: true, error: msg }, null, 2),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  if (campaigns.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Belum ada campaign dikonfigurasi di ACCESSTRADE_CAMPAIGNS' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const MIN_ITEM_SOLD = Number(Deno.env.get('ACCESSTRADE_MIN_ITEM_SOLD') || '10')
  const MAX_PRODUCTS_PER_SYNC = Number(Deno.env.get('ACCESSTRADE_MAX_PRODUCTS_PER_SYNC') || '5000')
  const BATCH_SIZE = 500

  const jwt = await signJwt(userUid, secretKey)
  const results: Record<string, unknown>[] = []
  let totalSynced = 0

  for (const { merchant, campaignId } of campaigns) {
    if (totalSynced >= MAX_PRODUCTS_PER_SYNC) {
      console.log(`[AccesstradeSync] Batas maksimal sync tercapai (${totalSynced}/${MAX_PRODUCTS_PER_SYNC}). Berhenti.`)
      break
    }

    try {
      const { feedUrls } = await getProductFeedUrls(jwt, siteId, campaignId)
      if (feedUrls.length === 0) {
        throw new Error(`Tidak ada feed URL ditemukan untuk campaign ${campaignId}`)
      }

      let campaignSyncedCount = 0

      for (const feedItem of feedUrls) {
        if (totalSynced >= MAX_PRODUCTS_PER_SYNC) break

        console.log(`[AccesstradeSync] Fetching CSV dari baseUrl: ${feedItem.baseUrl}`)
        const feedRes = await fetch(feedItem.baseUrl)
        if (!feedRes.ok) {
          console.warn(`Feed fetch gagal (${feedRes.status}) untuk ${feedItem.baseUrl}`)
          continue
        }

        const csvText = await feedRes.text()
        const rawRows = parseCsv(csvText)
        console.log(`[AccesstradeSync] Terbaca ${rawRows.length} baris dari CSV feed.`)

        const validProducts: any[] = []

        for (const row of rawRows) {
          if (totalSynced + validProducts.length >= MAX_PRODUCTS_PER_SYNC) {
            break
          }

          // Filter 1: Available == true
          const availRaw = String(row['Available'] || row['available'] || 'true').toLowerCase().trim()
          const isAvailable = availRaw === 'true' || availRaw === '1' || availRaw === 'yes'
          if (!isAvailable) continue

          // Filter 2: Min Item Sold Threshold
          const itemSold = parseNumeric(row['item_sold']) || 0
          if (itemSold < MIN_ITEM_SOLD) continue

          // Filter 3: Nama produk valid
          const productName = cleanProductName(row['Merchant Product Name'] || row['name'] || '')
          if (!productName) continue

          const productObj = mapCsvRowToProduct(row, merchant, campaignId)
          if (!productObj.affiliate_url) continue

          validProducts.push(productObj)
        }

        // Batch Insert / Upsert ke Supabase
        for (let b = 0; b < validProducts.length; b += BATCH_SIZE) {
          const batch = validProducts.slice(b, b + BATCH_SIZE)
          const { error } = await supabase
            .from('affiliate_products')
            .upsert(batch, { onConflict: 'merchant,campaign_id,external_product_id' })

          if (error) {
            console.error(`[AccesstradeSync] Supabase batch upsert error:`, error)
          } else {
            campaignSyncedCount += batch.length
            totalSynced += batch.length
          }
        }
      }

      await supabase.from('affiliate_sync_logs').insert({
        merchant,
        campaign_id: campaignId,
        status: 'success',
        products_synced: campaignSyncedCount,
      })

      results.push({ merchant, campaignId, synced: campaignSyncedCount })
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

  return new Response(JSON.stringify({ results, totalSynced, maxLimit: MAX_PRODUCTS_PER_SYNC }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  })
})
