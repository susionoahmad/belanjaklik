import type { CartItem, CustomerDetails, FulfillmentChannel } from '../../shared/types';
import { formatRupiah } from '../../shared/utils/formatters';

export function buildWhatsAppMessage(
  cartItems: CartItem[],
  customer: CustomerDetails,
  channel?: FulfillmentChannel,
  storePhone: string = '6281234567890'
): { text: string; link: string } {
  const channelName = channel ? channel.name : 'Jalur Pilihan Utama';
  let message = `Halo, saya ingin memesan barang melalui *${channelName}*:\n\n`;

  let subtotal = 0;
  cartItems.forEach((item, index) => {
    const itemPrice = item.product.promo_price || item.product.price;
    const itemTotal = itemPrice * item.quantity;
    subtotal += itemTotal;
    
    const brandPrefix = item.product.brand ? `[${item.product.brand}] ` : '';
    const noteText = item.item_notes ? ` _(${item.item_notes})_` : '';
    message += `• *${brandPrefix}${item.product.name}* ×${item.quantity} ${item.product.unit}${noteText}\n   └ ${formatRupiah(itemPrice)} / ${item.product.unit} = *${formatRupiah(itemTotal)}*\n`;
  });

  message += `\n*Estimasi Total:* ${formatRupiah(subtotal)}\n\n`;
  message += `*Detail Pemesan:*\n`;
  message += `• Nama: ${customer.customer_name || '-'}\n`;
  message += `• No HP: ${customer.customer_phone || '-'}\n`;
  message += `• Alamat Pengiriman: ${customer.delivery_address || '-'}\n`;
  if (customer.preferred_delivery_time) {
    message += `• Waktu Pengiriman: ${customer.preferred_delivery_time}\n`;
  }
  if (customer.delivery_notes) {
    message += `• Catatan Tambahan: ${customer.delivery_notes}\n`;
  }

  message += `\nMohon diproses, terima kasih!`;

  const encodedText = encodeURIComponent(message);
  const formattedPhone = storePhone.replace(/[^0-9]/g, '');
  const link = `https://wa.me/${formattedPhone}?text=${encodedText}`;

  return { text: message, link };
}
