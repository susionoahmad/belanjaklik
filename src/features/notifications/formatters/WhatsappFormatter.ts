import type { NotificationFormatter } from './NotificationFormatter';
import type { CartItem, CustomerDetails, FulfillmentChannel } from '../../shared/types';
import { formatRupiah } from '../../shared/utils/formatters';

export class WhatsappFormatter implements NotificationFormatter {
  type = 'whatsapp';

  formatOrder(items: CartItem[], customer: CustomerDetails, channel?: FulfillmentChannel): string {
    const channelText = channel ? `[Channel Pemenuhan: ${channel.name}]\n` : '';
    const itemListText = items.map((item, idx) => {
      const price = item.product.promo_price || item.product.price;
      const total = price * item.quantity;
      const notes = item.item_notes ? `  (Catatan: ${item.item_notes})` : '';
      return `${idx + 1}. *${item.product.name}*\n   ${item.quantity} ${item.product.unit} x ${formatRupiah(price)} = ${formatRupiah(total)}${notes}`;
    }).join('\n\n');

    const subtotal = items.reduce((sum, item) => sum + (item.product.promo_price || item.product.price) * item.quantity, 0);

    return `*PESANAN GROSIR / ASISTEN BELANJA* 🛒\n${channelText}\n*DATA PEMESAN:*\n👤 Nama: ${customer.customer_name}\n📞 WhatsApp: ${customer.customer_phone}\n📍 Alamat: ${customer.delivery_address}\n🕒 Jam Pengiriman: ${customer.preferred_delivery_time || 'Secepatnya'}\n📝 Catatan: ${customer.delivery_notes || '-'}\n\n*RINCIAN BELANJAAN:*\n${itemListText}\n\n*ESTIMASI TOTAL: ${formatRupiah(subtotal)}*\n\nMohon konfirmasi ketersediaan barang dan total pembayaran. Terima kasih!`;
  }

  formatQuotation(product: any, storePhone: string): string {
    const text = `*PERMINTAAN PENAWARAN GROSIR / B2B* 📄\n\nSaya tertarik dengan produk:\n*${product.name}*\nBrand: ${product.brand || '-'}\nHarga Acuan: ${formatRupiah(product.promo_price || product.price)}\n\nMohon info ketersediaan stok grosir dan harga khusus kuantitas besar. Terima kasih!`;
    const cleanPhone = storePhone.replace(/[^0-9]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
}
