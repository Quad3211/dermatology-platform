import { createClient } from "@supabase/supabase-js";

// Requires .env setup: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://usvoktqvnprakqqodrmq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzdm9rdHF2bnByYWtxcW9kcm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNzQ3MjcsImV4cCI6MjA4Nzk1MDcyN30.ESxPTYJ75QXRGEj74l0h4VtgBLc_2YALWbaaDfBo2vk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
