import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

export const routes = [

  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/produk/:slug',
    name: 'affiliate-product-detail',
    component: () => import('../views/AffiliateProductDetailView.vue')
  },
  {
    path: '/catalog',
    name: 'catalog',
    component: () => import('../views/CatalogView.vue')
  },
  {
    path: '/category/:slug',
    name: 'category-catalog',
    component: () => import('../views/CatalogView.vue')
  },
  {
    path: '/product/:slug',
    name: 'product-detail',
    component: () => import('../views/CatalogView.vue')
  },
  {
    path: '/packages',
    name: 'packages',
    component: () => import('../views/PackagesView.vue')
  },
  {
    path: '/bundle/:slug',
    name: 'bundle-detail',
    component: () => import('../views/PackagesView.vue')
  },
  {
    path: '/promos',
    name: 'promos',
    component: () => import('../views/PromosView.vue')
  },
  {
    path: '/promo/:slug',
    name: 'promo-detail',
    component: () => import('../views/PromosView.vue')
  },
  {
    path: '/campaign/:slug',
    name: 'campaign-landing',
    component: () => import('../views/CampaignLandingView.vue')
  },
  {
    path: '/affiliate',
    name: 'affiliate-catalog',
    component: () => import('../views/AffiliateView.vue')
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('../views/FavoritesView.vue')
  },
  {
    path: '/orders',
    name: 'orders',
    component: () => import('../views/OrdersView.vue')
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue')
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: () => import('../views/PrivacyPolicyView.vue')
  },
  {
    path: '/terms',
    name: 'terms',
    component: () => import('../views/TermsOfServiceView.vue')
  },
  {
    path: '/affiliate-disclosure',
    name: 'affiliate-disclosure',
    component: () => import('../views/AffiliateDisclosureView.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue')
  }
];

const router = createRouter({
  history: import.meta.env.SSR ? createMemoryHistory() : createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});


export default router;

