import * as XLSX from 'xlsx';
import type { Product } from '../../shared/types';
import { generateSlug } from '../../shared/utils/formatters';

export function parseProductFile(file: File): Promise<Partial<Product>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedProducts: Partial<Product>[] = rows.map((row, index) => {
          const name = row['Nama Produk'] || row['name'] || `Produk Import ${index + 1}`;
          const brand = row['Brand'] || row['brand'] || 'Lokal';
          const price = parseFloat(row['Harga'] || row['price'] || '0');
          const promoPrice = row['Harga Promo'] || row['promo_price'] ? parseFloat(row['Harga Promo'] || row['promo_price']) : undefined;
          const unit = row['Satuan'] || row['unit'] || 'pcs';
          const barcode = String(row['Barcode'] || row['barcode'] || '');
          const description = row['Deskripsi'] || row['description'] || '';

          return {
            name,
            slug: generateSlug(name),
            brand,
            barcode,
            price,
            promo_price: promoPrice,
            is_promo: !!promoPrice && promoPrice < price,
            unit,
            description,
            is_available: true,
            stock_status: 'in_stock',
            image_url: row['Image URL'] || row['image_url'] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
            purchase_method: 'owner_checkout'
          };
        });

        resolve(parsedProducts);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
