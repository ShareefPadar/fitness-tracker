import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eeqxtziplwnopjdktoli.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcXh0emlwbHdub3BqZGt0b2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNTYzMzUsImV4cCI6MjA4OTkzMjMzNX0.9AKmglRvEYHYWNJ4b9DxW-4n_OjGaDomZctkRy_7DA8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
