import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '@/stores';
import { useAuthStore } from '@/stores/auth';

// VIEWS
import HomeView from '../views/HomeView.vue'
import ProcessedCases from '../views/ProcessedCases.vue'
import UnprocessedCases from '../views/UnprocessedCases.vue'
import ProductList from '../views/ProductList.vue'
import Import from '../views/Import.vue'
import Login from '../views/LoginView.vue'

import About from '../views/AboutView.vue'
import PurchaseOrder from '../views/PurchaseOrderView.vue'
import PurchaseOrderV2 from '@/views/PurchaseOrderViewV2.vue';
import RequestToProcessView from '@/views/RequestToProcessView.vue'
import PickList from '../views/Picklist.vue'
import PasswordReset from '../views/PasswordReset.vue'

let localUser;
const ADMIN_ONLY_ROUTE_NAMES = new Set([
  'ProductList',
  'PurchaseOrders',
  'RequestToProcess',
  'Import',
]);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomeView,
        meta: { requiresAuth: true}
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: About,
        meta: { requiresAuth: true}
    },
    {
      path: '/processed',
      name: 'ProcessedCases',
      component: ProcessedCases,
        meta: { requiresAuth: true}
    },
    {
      path: '/unprocessed',
      name: 'UnprocessedCases',
      component: UnprocessedCases,
        meta: { requiresAuth: true}
    },
    {
      path: '/productlist',
      name: 'ProductList',
      component: ProductList,
        meta: { requiresAuth: true}
    },
    {
      path: '/import',
      name: 'Import',
      component: Import,
        meta: { requiresAuth: true}
    },
    {
      path: '/login',
      name: 'Login',
      component: Login
    },
    {
      path: '/purchaseorders',
      name: 'PurchaseOrders',
      component: PurchaseOrder,
      // component: PurchaseOrderV2,
        meta: { requiresAuth: true}
    },
    {
      path: '/requesttoprocess',
      name: 'RequestToProcess',
      component: RequestToProcessView,
        meta: { requiresAuth: true}
    },
    {
      path: '/picklists',
      name: 'Picklists',
      component: PickList,
        meta: { requiresAuth: true}
    },
    {
      path: '/passwordreset',
      name: 'PasswordReset',
      component: PasswordReset
    },
  ]
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) {
    return true;
  }

  const authStore = useAuthStore(pinia);

  // initialize() hydrates cached auth state and registers listeners.
  await authStore.initialize();

  // Use cached auth state here so route changes never block on a live network call.
  // App-level visibility/focus handlers perform background session repair.
  localUser = authStore.user;

  if (!localUser) {
    localUser = await authStore.refreshUser();
  }

  if (!localUser) {
    return { name: 'Login' };
  }

  const companyRole = authStore.companyRole;
  const routeName = String(to.name ?? '');
  const canAccessAdminRoutes = companyRole === 'Admin' || companyRole === 'Management';

  if (!canAccessAdminRoutes && ADMIN_ONLY_ROUTE_NAMES.has(routeName)) {
    return {
      name: 'Home',
      query: {
        denied: routeName,
      },
    };
  }

  return true;
});

export default router
