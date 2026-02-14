import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fsghqtawhtoafwdlrnwz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('Supabase anon key not configured. Auth will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'placeholder');
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
