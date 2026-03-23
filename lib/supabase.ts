import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client public pour le frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client admin pour le backend (API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);