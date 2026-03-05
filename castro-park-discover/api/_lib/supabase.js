import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) throw new Error("SUPABASE env vars não configuradas (VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});
