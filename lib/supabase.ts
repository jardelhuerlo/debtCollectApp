import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function devAutoLogin() {
  const { data } = await supabase.auth.getUser();

  // Si ya hay sesión, no hacemos nada
  if (data?.user) return;

  // Usuario de pruebas
  await supabase.auth.signInWithPassword({
    email: "test@example.com",
    password: "12345678",
  });
}

