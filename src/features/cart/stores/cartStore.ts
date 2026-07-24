import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { CartItem, Product, CustomerDetails, FulfillmentChannel } from '../../shared/types';
import { offlineDb } from '../../shared/db/offlineDb';
import { dataService } from '../../shared/db/dataService';
import { buildWhatsAppMessage } from '../services/whatsappService';

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);
  const isDrawerOpen = ref(false);
  const isDeliveryFormOpen = ref(false);
  const selectedChannel = ref<FulfillmentChannel | null>(null);

  const customer = ref<CustomerDetails>({
    customer_name: '',
    customer_phone: '',
    delivery_address: '',
    delivery_notes: '',
    preferred_delivery_time: 'Pagi (08:00 - 11:00)',
    fulfillment_channel_id: ''
  });

  // Load initial cart and customer data from local cache
  const initCart = async () => {
    const cachedCart = await offlineDb.getCart();
    if (cachedCart) items.value = cachedCart;

    const savedCustomer = localStorage.getItem('psa_customer_info');
    if (savedCustomer) {
      try {
        customer.value = JSON.parse(savedCustomer);
      } catch (e) {}
    }
  };

  initCart();

  // Watch cart changes to persist
  watch(items, async (newItems) => {
    await offlineDb.setCart(newItems);
  }, { deep: true });

  // Watch customer changes to persist
  watch(customer, (newCust) => {
    localStorage.setItem('psa_customer_info', JSON.stringify(newCust));
  }, { deep: true });

  const totalItemCount = computed(() => items.value.reduce((acc, item) => acc + item.quantity, 0));

  const subtotal = computed(() => {
    return items.value.reduce((acc, item) => {
      const price = item.product.promo_price || item.product.price;
      return acc + (price * item.quantity);
    }, 0);
  });

  const totalSavings = computed(() => {
    return items.value.reduce((acc, item) => {
      if (item.product.promo_price && item.product.promo_price < item.product.price) {
        return acc + ((item.product.price - item.product.promo_price) * item.quantity);
      }
      return acc;
    }, 0);
  });

  const toggleCartDrawer = () => {
    isDrawerOpen.value = !isDrawerOpen.value;
  };

  const addItem = (product: Product, quantity = 1, notes?: string) => {
    if (product.is_available === false || product.stock_status === 'out_of_stock') {
      alert(`Maaf, stok "${product.name}" sedang kosong.`);
      return;
    }
    const existing = items.value.find(i => i.product.id === product.id);
    if (existing) {
      existing.quantity += quantity;
      if (notes) existing.item_notes = notes;
    } else {
      items.value.push({ product, quantity, item_notes: notes });
    }
  };


  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
    } else {
      const existing = items.value.find(i => i.product.id === productId);
      if (existing) existing.quantity = quantity;
    }
  };

  const removeItem = (productId: string) => {
    items.value = items.value.filter(i => i.product.id !== productId);
  };

  const clearCart = () => {
    items.value = [];
  };

  const setFulfillmentChannel = (channel: FulfillmentChannel) => {
    selectedChannel.value = channel;
    customer.value.fulfillment_channel_id = channel.id;
  };

  const checkoutWhatsApp = async (overridePhone?: string) => {
    if (items.value.length === 0) return;

    const storeProfile = await dataService.fetchStoreProfile();
    const targetPhone = overridePhone || storeProfile.phone || '6281234567890';

    // Save request record to database & local history
    const requestItems = items.value.map(i => ({
      product_id: i.product.id,
      product_name: i.product.name,
      brand: i.product.brand || '',
      price: i.product.promo_price || i.product.price,
      quantity: i.quantity,
      unit: i.product.unit,
      notes: i.item_notes
    }));

    await dataService.saveShoppingRequest({
      customer_name: customer.value.customer_name,
      customer_phone: customer.value.customer_phone,
      delivery_address: customer.value.delivery_address,
      delivery_notes: customer.value.delivery_notes,
      preferred_delivery_time: customer.value.preferred_delivery_time,
      subtotal: subtotal.value,
      estimated_total: subtotal.value,
      fulfillment_channel_id: customer.value.fulfillment_channel_id
    }, requestItems);

    const { link } = buildWhatsAppMessage(items.value, customer.value, selectedChannel.value || undefined, targetPhone);

    // Open WhatsApp
    window.open(link, '_blank');
  };

  return {
    items,
    isDrawerOpen,
    isDeliveryFormOpen,
    customer,
    selectedChannel,
    totalItemCount,
    subtotal,
    totalSavings,
    toggleCartDrawer,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setFulfillmentChannel,
    checkoutWhatsApp
  };
});
