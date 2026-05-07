import { defineStore } from 'pinia';
import { supabase } from '@/clients/supabase';

type UserProfile = {
  id: string;
  company_role: string | null;
  full_name: string | null;
};


export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null as any,
        profile: null as UserProfile | null,
        initialized: false,
    }),
    getters: {
        userId: (state) => state.user?.id ?? null,
        isAuthenticated: (state) => !!state.user,
        companyRole: (state) => state.profile?.company_role ?? null,
    },
    actions: {

        async fetchProfile(userId: string | null) {
            if (!userId) {
                this.profile = null;
                return null;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('id, company_role, full_name')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('Error fetching profile:', error);
                this.profile = null;
                return null;
            }

            this.profile = data ?? null;
            return this.profile;
        },

        async initialize(){
            if (this.initialized) return;

            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('Error getting auth session:', error);
                    this.user = null;
                } else {
                    this.user = data?.session?.user ?? null;
                    await this.fetchProfile(this.user?.id ?? null);
                }
            } catch (error) {
                console.error('Error getting auth session:', error);
                this.user = null;
            } finally {
                this.initialized = true;
            }

            supabase.auth.onAuthStateChange(async (_event, session) => {
                this.user = session?.user ?? null;
                await this.fetchProfile(this.user?.id ?? null);
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

        /**
         * Validates the session against the Supabase server and refreshes the
         * access token if it has expired. Unlike getSession(), this makes a
         * network request so it always returns an up-to-date result.
         *
         * Use this in route guards and on tab-visibility restore to prevent
         * stale tokens from silently failing on subsequent Supabase calls.
         *
         * @returns The current User if authenticated, or null if signed out.
         */
        async ensureFreshSession() {
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error || !data.user) {
                    this.user = null;
                    this.profile = null;
                    return null;
                }
                this.user = data.user;
                if (!this.profile || this.profile.id !== data.user.id) {
                    await this.fetchProfile(data.user.id);
                }
                return data.user;
            } catch (err) {
                console.error('Error ensuring fresh session:', err);
                this.user = null;
                return null;
            }
        },
    },
});
