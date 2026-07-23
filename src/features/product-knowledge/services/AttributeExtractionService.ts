import type { Product } from '../../shared/types';
import type { ProductAttributeEntity } from '../types';

export class AttributeExtractionService {
  static extractAttributes(product: Product): ProductAttributeEntity[] {
    const text = `${product.name} ${product.brand || ''} ${product.description || ''}`.toLowerCase();
    const attributes: Array<{ key: string; value: string }> = [];

    attributes.push({ key: 'Brand', value: product.brand || 'Umum' });
    attributes.push({ key: 'Product Name', value: product.name });
    attributes.push({ key: 'Unit', value: product.unit || 'pcs' });

    // Package Size / Weight
    const weightMatch = text.match(/(\d+(?:\.\d+)?\s*(?:kg|g|gr|l|ltr|litur|ml))/i);
    if (weightMatch) {
      attributes.push({ key: 'Package Size / Volume', value: weightMatch[1] });
    }

    if (text.includes('minyak') || text.includes('goreng')) {
      attributes.push({ key: 'Product Type', value: 'Minyak Goreng Sawit' });
      attributes.push({ key: 'Usage', value: 'Memasak & Menggoreng Makanan' });
      attributes.push({ key: 'Storage', value: 'Simpan pada suhu ruang sejuk' });
      attributes.push({ key: 'Shelf Life', value: '24 Bulan' });
    } else if (text.includes('indomie') || text.includes('mie')) {
      attributes.push({ key: 'Product Type', value: 'Mie Instan' });
      attributes.push({ key: 'Flavor', value: text.includes('goreng') ? 'Goreng Spesial' : 'Kuah Kaldu' });
      attributes.push({ key: 'Usage', value: 'Makanan Praktis Kos & Keluarga' });
      attributes.push({ key: 'Shelf Life', value: '12 Bulan' });
    } else if (text.includes('beras')) {
      attributes.push({ key: 'Product Type', value: 'Beras Putih Premium' });
      attributes.push({ key: 'Quality', value: 'Pulen & Bersih' });
      attributes.push({ key: 'Shelf Life', value: '12 Bulan' });
    } else {
      attributes.push({ key: 'Product Type', value: 'Kebutuhan Harian' });
      attributes.push({ key: 'Target Audience', value: 'Keluarga Indonesia' });
    }

    return attributes.map((attr, idx) => ({
      id: `attr_${product.id}_${idx}`,
      product_id: product.id,
      attribute_key: attr.key,
      attribute_value: attr.value,
      created_at: new Date().toISOString()
    }));
  }
}
