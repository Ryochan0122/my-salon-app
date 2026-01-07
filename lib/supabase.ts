import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // 👈 これでブラウザを閉じてもログイン維持
    autoRefreshToken: true, // 👈 トークンを自動更新
    detectSessionInUrl: true,
  },
});

// 現在操作中の店舗IDを取得（重要）
export const getCurrentShopId = () => {
  if (typeof window === 'undefined') return null;
  // ログイン情報またはストレージから店舗IDを特定
  return localStorage.getItem('aura_shop_id');
};