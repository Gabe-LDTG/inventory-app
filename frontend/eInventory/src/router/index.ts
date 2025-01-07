import { createRouter, createWebHistory, useRoute } from 'vue-router'
// @ts-ignore
import { supabase } from '../clients/supabase';

// VIEWS
import HomeView from '../views/HomeView.vue'
import ProcessedCases from '../views/ProcessedCases.vue'
import UnprocessedCases from '../views/UnprocessedCases.vue'
import ProductList from '../views/ProductList.vue'
import Import from '../views/Import.vue'
import Login from '../views/LoginView.vue'
// @ts-ignore
import Login2 from '../views/LoginView2.vue';
import PurchaseOrder from '../views/PurchaseOrderView.vue'
import PurchaseOrderView_v2 from '@/views/PurchaseOrderView_v2.vue'
import RequestToProcessView from '@/views/RequestToProcessView.vue'

import axios from "axios";

let localUser;
const route = useRoute();

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
      component: () => import('../views/AboutView.vue'),
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
      path: '/login2',
      name: 'Login2',
      component: Login2
    },
    {
      path: '/purchaseorders',
      name: 'PurchaseOrders',
      component: PurchaseOrder,
        meta: { requiresAuth: true}
    },
    {
      path: '/purchaseorders_v2',
      name: 'PurchaseOrders_v2',
      component: PurchaseOrderView_v2,
        meta: { requiresAuth: true}
    },
    {
      path: '/requesttoprocess',
      name: 'RequestToProcess',
      component: RequestToProcessView,
        meta: { requiresAuth: true}
    },
  ]
})

async function getUser(next:any) {
  // console.log("in GetUser");
  localUser = await supabase.auth.getSession();
  if(localUser.data.session == null){
    next('/login2')
  }
  else{
    next();
  }
}

router.beforeEach((to, from, next) => {
  // console.log("in beforeEach");
  // console.log(route);
  if (to.meta.requiresAuth){
    getUser(next);
  }
  else {
    next();
  }
});

export default router
