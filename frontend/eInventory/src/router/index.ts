import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProcessedCases from '../views/ProcessedCases.vue'
import UnprocessedCases from '../views/UnprocessedCases.vue'
import ProductList from '../views/ProductList.vue'
import Import from '../views/Import.vue'
import Login from '../views/LoginView.vue'

import axios from "axios";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/home',
      name: 'Home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/processed',
      name: 'ProcessedCases',
      component: ProcessedCases
    },
    {
      path: '/unprocessed',
      name: 'UnprocessedCases',
      component: UnprocessedCases
    },
    {
      path: '/productlist',
      name: 'ProductList',
      component: ProductList
    },
    {
      path: '/import',
      name: 'Import',
      component: Import
    },
    {
      path: '/',
      name: 'Login',
      component: Login
    }
  ]
})

/* router.beforeEach((to, from, next) => {
  axios.get('http://localhost:5000/checklogin')
    .then(res => {
      if (to.path === '/') next('/home')
      else next();
    })
    .catch(err => {
      if (to.path === '/') next()
        else next('/');
    });
}); */

export default router
