import * as XLSX from 'xlsx';
import type { Product } from '../../shared/types';
import { generateSlug } from '../../shared/utils/formatters';
import { ExcelDriver } from '../../product-import/drivers/ExcelDriver';

export async function parseProductFile(file: File): Promise<Partial<Product>[]> {
  const driver = new ExcelDriver();
  const rows = await driver.parseExcelInput({ files: [file] });

  return rows.map((row, index) => {
    const name = row.product_name || `Produk Import ${index + 1}`;
    const brand = row.brand || 'Lokal';
    const price = typeof row.price === 'number' ? row.price : parseFloat(String(row.price || 0));
    const originalPrice = typeof row.original_price === 'number' ? row.original_price : parseFloat(String(row.original_price || 0));

    return {
      name,
      slug: generateSlug(name),
      brand,
      price,
      promo_price: originalPrice > price && price > 0 ? price : undefined,
      is_promo: originalPrice > price && price > 0,
      unit: row.package_size || 'pcs',
      description: row.variant ? `Varian: ${row.variant}` : '',
      is_available: !String(row.stock_status || '').toLowerCase().includes('kosong'),
      stock_status: String(row.stock_status || '').toLowerCase().includes('kosong') ? 'out_of_stock' : 'in_stock',
      image_url: row.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
      purchase_method: 'owner_checkout'
    };
  });
}
