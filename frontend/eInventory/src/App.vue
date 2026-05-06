<script setup lang="ts">
import { computed, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '@/stores/auth';
import { pinia } from '@/stores';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore(pinia);

const canAccessAdminTabs = computed(() => {
  const role = authStore.companyRole;
  return role === 'Admin' || role === 'Management';
});

watch(
  () => route.query.denied,
  (denied) => {
    if (typeof denied !== 'string' || denied.length === 0) {
      return;
    }

    toast.add({
      severity: 'warn',
      summary: 'Access Restricted',
      detail: `You do not have access to ${denied}.`,
      life: 100000,
    });

    const { denied: _removed, ...remainingQuery } = route.query;
    router.replace({
      name: route.name as string,
      params: route.params,
      query: remainingQuery,
    });
  }
);
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
  <Toast />
  <header>
    <img alt="Vue logo" class="logo" src="@/assets/echapps rgb.png" width="200" height="50" />

      <nav v-if="route.name != 'Login' && route.name != 'PasswordReset'"> 
        <RouterLink :to="{name: 'Home'}">Home</RouterLink>
        <RouterLink v-if="canAccessAdminTabs" :to="{ name: 'ProductList' }">Product Keys</RouterLink>
        <RouterLink v-if="canAccessAdminTabs" :to="{ name: 'PurchaseOrders' }">Purchase Orders</RouterLink>
        <RouterLink :to="{ name: 'UnprocessedCases' }">Unprocessed Product</RouterLink>
        <RouterLink v-if="canAccessAdminTabs" :to="{ name: 'RequestToProcess' }">Request To Process</RouterLink>
        <RouterLink :to="{ name: 'Picklists'}">Picklists</RouterLink>
        <RouterLink :to="{ name: 'ProcessedCases' }">Processed Cases</RouterLink>
        <RouterLink v-if="canAccessAdminTabs" :to="{ name: 'Import' }">Import</RouterLink>
        <RouterLink :to="{ name: 'about' }">About</RouterLink> 
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
