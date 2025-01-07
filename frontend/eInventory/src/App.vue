<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { supabase } from './clients/supabase';

const route = useRoute();
</script>

<!-- <script lang="ts">
import action from "./components/utils/axiosUtils";
import { supabase } from "./supabase"
export default {
  data(){
    return{
      sessionUser: "",
    }
  },
  created(){
    this.getSessionUser();
  },
  methods:{
    async getSessionUser(){
      console.log("IN get session user")
      this.sessionUser = await supabase.auth.getSession();
      console.log(this.sessionUser);
    },
  },
}
</script> -->

<template>
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/echapps rgb.png" width="200" height="50" />

      <nav v-if="route.name != 'Login2'"> 
        <RouterLink :to="{name: 'Home'}">Home</RouterLink>
        <!-- <RouterLink :to="{name: 'Login2'}">Login</RouterLink> -->
        <RouterLink :to="{ name: 'ProductList' }">Product Keys</RouterLink>
        <!-- <RouterLink :to="{ name: 'PurchaseOrders' }">Purchase Orders</RouterLink> -->
        <RouterLink :to="{ name: 'PurchaseOrders_v2' }">Purchase Orders</RouterLink>
        <RouterLink :to="{ name: 'UnprocessedCases' }">Unprocessed Product</RouterLink>
        <!-- SPOT FOR WORK ORDERS -->
        <RouterLink :to="{ name: 'RequestToProcess' }">Request To Process</RouterLink>
        <RouterLink :to="{ name: 'ProcessedCases' }">Processed Cases</RouterLink>
        <!-- SPOT FOR SHIPPING LOGS -->
        <RouterLink :to="{ name: 'Import' }">Import</RouterLink>
        <RouterLink to="/about">About</RouterLink> 
      </nav>
  
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
