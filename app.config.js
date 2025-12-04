export default {
  expo: {
    name: "mi-app",
    slug: "mi-app",
    scheme: "debtcollectapp",
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
