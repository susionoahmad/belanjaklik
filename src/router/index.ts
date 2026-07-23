import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

export default router;
