import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./supabase-env.js";

const env = import.meta.env ?? {};
const supabaseUrl = env.VITE_SUPABASE_URL || supabaseConfig.url;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || supabaseConfig.publishableKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
