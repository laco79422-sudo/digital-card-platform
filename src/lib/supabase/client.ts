import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

const placeholderPatterns = [
  "your-project-url",
  "your-anon-key",
  "YOUR_SUPABASE_URL",
  "YOUR_SUPABASE_ANON_KEY",
];

function isConfigured(value: string) {
  if (!value) return false;
  return !placeholderPatterns.some((p) => value.includes(p));
}

export const isSupabaseConfigured = isConfigured(url) && isConfigured(anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
