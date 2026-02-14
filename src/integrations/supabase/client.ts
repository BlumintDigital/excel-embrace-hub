import { createClient } from '@supabase/supabase-js';

// Publishable credentials - safe for client-side use with RLS enabled
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fsghqtawhtoafwdlrnwz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzZ2hxdGF3aHRvYWZ3ZGxybnd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMDAyMTksImV4cCI6MjA4NjY3NjIxOX0.FyZVQaWeD16EhYvHbfQzgU9O9O6yv0gix_b2W3Z-QlA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
