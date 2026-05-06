import { defineStore } from 'pinia';
import { supabase } from '@/clients/supabase';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as any,
        initialized: false,
    }),
    getters: {
        userId: (state) => state.user?.id ?? null,
        isAuthenticated: (state) => !!state.user,
    },
    actions: {
        async initialize(){
            if (this.initialized) return;

            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Error getting auth session:', error);
                    this.user = null;
                } else {
                    this.user = data?.session?.user ?? null;
                }
            } catch (error) {
                console.error('Error getting auth session:', error);
                this.user = null;
            } finally {
                this.initialized = true;
            }

            supabase.auth.onAuthStateChange((_event, session) => {
                this.user = session?.user ?? null;
            });
        },

        async refreshUser(){
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Error refreshing auth session:', error);
                    this.user = null;
                    return this.user;
                }

                this.user = data?.session?.user ?? null;
                return this.user;
            } catch (error) {
                console.error('Error refreshing auth session:', error);
                this.user = null;
                return this.user;
            }
        },
    },
});
