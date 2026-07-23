import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { ShoppingTemplate, ShoppingRequest } from '../../shared/types';
import { dataService } from '../../shared/db/dataService';
import { offlineDb } from '../../shared/db/offlineDb';
import { useCartStore } from '../../cart/stores/cartStore';
import { useCatalogStore } from '../../catalog/stores/catalogStore';

export const useShoppingStore = defineStore('shopping', () => {
  const templates = ref<ShoppingTemplate[]>([]);
  const requestHistory = ref<ShoppingRequest[]>([]);
  const isLoading = ref(false);

  const fetchShoppingData = async () => {
    isLoading.value = true;
    try {
      templates.value = await dataService.fetchTemplates();
      requestHistory.value = (await offlineDb.getRequests()) || [];
    } catch (e) {
      console.error('Failed to load shopping packages & history', e);
    } finally {
      isLoading.value = false;
    }
  };

  const loadTemplateToCart = (template: ShoppingTemplate) => {
    const cartStore = useCartStore();
    const catalogStore = useCatalogStore();

    template.items.forEach(item => {
      // Find matching catalog product if possible
      const matched = catalogStore.products.find(p => p.name.toLowerCase().includes(item.product_name.toLowerCase()));
      if (matched) {
        cartStore.addItem(matched, item.quantity);
      } else {
        // Fallback custom dummy product
        cartStore.addItem({
          id: `custom_${Date.now()}_${Math.random()}`,
          name: item.product_name,
          slug: item.product_name.toLowerCase().replace(/\s+/g, '-'),
          brand: 'Paket',
          barcode: '',
          description: 'Produk Paket',
          unit: item.unit || 'pcs',
          price: item.default_price,
          is_promo: false,
          is_featured: false,
          is_popular: false,
          is_available: true,
          stock_status: 'in_stock',
          image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
          purchase_method: 'owner_checkout'
        }, item.quantity);
      }
    });

    cartStore.isDrawerOpen = true;
  };

  const repeatOrder = (request: ShoppingRequest) => {
    const cartStore = useCartStore();
    const catalogStore = useCatalogStore();

    if (request.items) {
      request.items.forEach(item => {
        const matched = catalogStore.products.find(p => p.id === item.product_id || p.name.toLowerCase() === item.product_name.toLowerCase());
        if (matched) {
          cartStore.addItem(matched, item.quantity, item.notes);
        } else {
          cartStore.addItem({
            id: item.product_id || `req_item_${Date.now()}`,
            name: item.product_name,
            slug: item.product_name.toLowerCase().replace(/\s+/g, '-'),
            brand: item.brand || 'Order',
            barcode: '',
            description: 'Produk Histori Pesanan',
            unit: item.unit || 'pcs',
            price: item.price,
            is_promo: false,
            is_featured: false,
            is_popular: false,
            is_available: true,
            stock_status: 'in_stock',
            image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400',
            purchase_method: 'owner_checkout'
          }, item.quantity, item.notes);
        }
      });
    }

    cartStore.isDrawerOpen = true;
  };

  const saveTemplate = async (templateData: Partial<ShoppingTemplate>) => {
    const saved = await dataService.saveTemplate(templateData);
    await fetchShoppingData();
    return saved;
  };

  const deleteTemplate = async (id: string) => {
    await dataService.deleteTemplate(id);
    await fetchShoppingData();
  };

  return {
    templates,
    requestHistory,
    isLoading,
    fetchShoppingData,
    loadTemplateToCart,
    repeatOrder,
    saveTemplate,
    deleteTemplate
  };
});
