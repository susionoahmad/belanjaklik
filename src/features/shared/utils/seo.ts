import type { Product } from '../types';

export function updatePageSeo(title: string, description?: string, image?: string) {
  document.title = title ? `${title} | Personal Shopping Assistant` : 'Personal Shopping Assistant';
  
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', description || 'Personal Shopping Assistant - Asisten Belanja Pribadi');
  }

  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    ogTitle.setAttribute('content', title);
  }

  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) {
    ogDesc.setAttribute('content', description || 'Pesan sembako & kebutuhan harian dengan cepat via WhatsApp.');
  }

  if (image) {
    let ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.setAttribute('content', image);
  }
}

export function injectProductJsonLd(product: Product) {
  let script = document.getElementById('json-ld-product');
  if (!script) {
    script = document.createElement('script');
    script.id = 'json-ld-product';
    script.setAttribute('type', 'application/ld+json');
    document.head.appendChild(script);
  }

  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    'name': product.name,
    'image': [product.image_url],
    'description': product.description || product.name,
    'sku': product.barcode || product.id,
    'brand': {
      '@type': 'Brand',
      'name': product.brand || 'Personal Shopping Assistant'
    },
    'offers': {
      '@type': 'Offer',
      'url': window.location.href,
      'priceCurrency': 'IDR',
      'price': product.promo_price || product.price,
      'availability': product.is_available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  };

  script.textContent = JSON.stringify(structuredData);
}
