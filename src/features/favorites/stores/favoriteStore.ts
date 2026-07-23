import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { useCatalogStore } from '../../catalog/stores/catalogStore';

export const useFavoritesStore = defineStore('favorites', () => {
  const favoriteIds = useStorage<string[]>('psa_favorites_ids', []);

  const isFavorite = (productId: string) => {
    return favoriteIds.value.includes(productId);
  };

  const toggleFavorite = (productId: string) => {
    if (isFavorite(productId)) {
      favoriteIds.value = favoriteIds.value.filter(id => id !== productId);
    } else {
      favoriteIds.value.push(productId);
    }
  };

  const favoriteProducts = computed(() => {
    const catalogStore = useCatalogStore();
    return catalogStore.products.filter(p => favoriteIds.value.includes(p.id));
  });

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    favoriteProducts
  };
});
