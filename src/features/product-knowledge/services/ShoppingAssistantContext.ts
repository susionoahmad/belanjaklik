import type { Product } from '../../shared/types';
import type { ShoppingAssistantQueryResult } from '../types';

export class ShoppingAssistantContext {
  static resolveQuery(query: string, catalog: Product[]): ShoppingAssistantQueryResult {
    const q = query.toLowerCase().trim();

    if (q.includes('murah') || q.includes('paling murah') || q.includes('terjangkau')) {
      let filtered = catalog;
      if (q.includes('minyak')) {
        filtered = catalog.filter(p => p.name.toLowerCase().includes('minyak'));
      } else if (q.includes('beras')) {
        filtered = catalog.filter(p => p.name.toLowerCase().includes('beras'));
      }
      const sorted = [...filtered].sort((a, b) => (a.promo_price || a.price) - (b.promo_price || b.price));
      const cheapest = sorted[0];

      return {
        query,
        matchedProducts: sorted.slice(0, 3),
        explanation: cheapest ? `Produk termurah adalah ${cheapest.name} dengan harga Rp ${(cheapest.promo_price || cheapest.price).toLocaleString('id-ID')}.` : 'Tidak ada rekomendasi harga terendah.',
        suggestedAction: 'Tambahkan ke Keranjang'
      };
    }

    if (q.includes('promo') || q.includes('diskon')) {
      const promos = catalog.filter(p => p.is_promo || p.promo_price);
      return {
        query,
        matchedProducts: promos.slice(0, 5),
        explanation: `Ditemukan ${promos.length} produk promo spesial hemat di catalog Alfamind!`,
        suggestedAction: 'Lihat Promo Hari Ini'
      };
    }

    if (q.includes('alternatif') || q.includes('pengganti')) {
      let targetBrand = 'Bimoli';
      if (q.includes('indomie')) targetBrand = 'Indomie';

      const matched = catalog.filter(p => p.name.toLowerCase().includes('minyak') || p.brand?.toLowerCase().includes('fortune') || p.brand?.toLowerCase().includes('sania'));
      return {
        query,
        matchedProducts: matched.slice(0, 3),
        explanation: `Rekomendasi alternatif ${targetBrand}: Produk pilihan setara dengan harga kompetitif.`,
        suggestedAction: 'Bandingkan Produk'
      };
    }

    // Default search fallback
    const matched = catalog.filter(p => p.name.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)));
    return {
      query,
      matchedProducts: matched.slice(0, 4),
      explanation: matched.length > 0 ? `Ditemukan ${matched.length} produk sesuai pencarian "${query}".` : `Tidak ada hasil langsung untuk "${query}".`,
      suggestedAction: 'Jelajahi Katalog'
    };
  }
}
