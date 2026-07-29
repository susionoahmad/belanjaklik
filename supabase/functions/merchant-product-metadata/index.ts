const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
})

const cleanText = (value: string | undefined): string | undefined =>
  value?.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim() || undefined

const getMeta = (html: string, key: string): string | undefined => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return cleanText(match[1])
  }
  return undefined
}

const parseJsonLd = (html: string): Record<string, any> => {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1].trim())
      const items = Array.isArray(parsed) ? parsed : (parsed['@graph'] || [parsed])
      const product = items.find((item: any) => item?.['@type'] === 'Product' || (Array.isArray(item?.['@type']) && item['@type'].includes('Product')))
      if (product) return product
    } catch { /* continue with meta tags */ }
  }
  return {}
}

const parsePrice = (value?: string): number | undefined => {
  if (!value) return undefined
  const parsed = Number(value.replace(/[^0-9]/g, ''))
  return parsed > 0 ? parsed : undefined
}

const inferCategory = (name?: string, description?: string): string | undefined => {
  const text = (name || '') + ' ' + (description || '')
  if (/mesin cuci|kulkas|vacuum|setrika|dispenser|peralatan rumah|cleaning|tissue|sabun|deterjen/i.test(text)) return 'Rumah Tangga'
  if (/laptop|komputer|handphone|smartphone|tablet|televisi|tv |kamera|headphone|earphone|speaker|charger/i.test(text)) return 'Gadget & Elektronik'
  if (/makeup|skincare|kosmetik|parfum|shampoo|sabun wajah|beauty/i.test(text)) return 'Kecantikan & Skincare'
  if (/popok|bayi|baby|mainan anak|susu formula/i.test(text)) return 'Ibu & Bayi'
  if (/peralatan elektronik|electronic appliance|mesin elektronik|kettle listrik|ketel listrik|toaster listrik|peralatan listrik|toaster|kettle|rice cooker|magic com|electric kettle|sandwich maker|air fryer|microwave|microwave oven|air cooler|water heater/i.test(text)) return 'Peralatan Elektronik'
  if (/panci|wajan|blender|rice cooker|dapur|makanan|minuman|snack/i.test(text)) return 'Dapur & Kuliner'
  if (/baju|kaos|sepatu|sandal|hijab|fashion|tas|dompet/i.test(text)) return 'Fashion & Hijab'
  return undefined
}
const detectMerchant = (url: string): string => {
  const source = url.toLowerCase()
  const host = new URL(url).hostname.toLowerCase()
  if (source.includes('blibli')) return 'blibli'
  if (host.includes('shopee')) return 'shopee'
  if (host.includes('tokopedia')) return 'tokopedia'
  if (host.includes('lazada')) return 'lazada'
  if (host.includes('tiktok')) return 'tiktok_shop'
  return 'other'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Gunakan POST' }, 405)

  try {
    const { url } = await req.json()
    const productUrl = String(url || '').trim()
    new URL(productUrl)
    const response = await fetch(productUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BelanjaKlikBot/1.0)' },
      redirect: 'follow',
    })
    if (!response.ok) throw new Error(`Merchant mengembalikan HTTP ${response.status}`)

    const html = await response.text()
    const jsonLd = parseJsonLd(html)
    const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : (jsonLd.offers || {})
    const resolvedUrl = response.url || productUrl
    const finalUrl = (() => {
      try { return new URL(resolvedUrl).searchParams.get('url') || resolvedUrl } catch { return resolvedUrl }
    })()
    const finalHost = new URL(finalUrl).hostname
    const name = getMeta(html, 'og:title') || getMeta(html, 'twitter:title') || cleanText(jsonLd.name)
    const description = getMeta(html, 'og:description') || getMeta(html, 'description') || cleanText(jsonLd.description)
    const imageUrl = getMeta(html, 'og:image') || getMeta(html, 'twitter:image') || (typeof jsonLd.image === 'string' ? jsonLd.image : jsonLd.image?.url)
    const price = parsePrice(getMeta(html, 'product:price:amount') || getMeta(html, 'og:price:amount') || String(offer.price || jsonLd.price || ''))
    const currency = getMeta(html, 'product:price:currency') || getMeta(html, 'og:price:currency') || offer.priceCurrency
    if (!name) throw new Error('Nama produk tidak ditemukan. Tempel URL produk merchant asli, bukan link pendek atid.me.')

    return json({
      product_url: finalUrl,
      name,
      description,
      image_url: imageUrl,
      price,
      shop_name: cleanText(jsonLd.brand?.name) || finalHost.replace(/^www\./, ''),
      merchant: detectMerchant(finalUrl),
      category: inferCategory(name, description),
      currency,
    })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Gagal membaca produk' }, 422)
  }
})