// BACKEND DATABASE CONNECTION
import { createClient } from '@supabase/supabase-js'

/* const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY */

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabase = createClient('https://uqffuheuofqjpsakgcvo.supabase.co/', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZmZ1aGV1b2ZxanBzYWtnY3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDg2MzMzMTMsImV4cCI6MjAyNDIwOTMxM30.AGvfEPikOl_vrr2p9lwurQ_jaDPlCnrdfdBHF9RQX-U')