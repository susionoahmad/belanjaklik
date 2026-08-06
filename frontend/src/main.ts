import { ViteSSG } from 'vite-ssg';
import { createPinia } from 'pinia';
import { createHead } from '@unhead/vue/client';
import App from './App.vue';
import { routes } from './router';
import './style.css';

export const createApp = ViteSSG(
  App,
  {
    routes,
    scrollBehavior() {
      return { top: 0 };
    }
  },
  ({ app, head }) => {
    const headInstance = head || createHead();
    app.use(headInstance);
    const pinia = createPinia();
    app.use(pinia);
  }
);
