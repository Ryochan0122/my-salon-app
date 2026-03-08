import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: async (name, acquireTimeout, fn) => {
        // Web Locks APIが使えない環境ではlockをスキップ
        if (typeof navigator === 'undefined' || !navigator.locks) {
          return fn();
        }
        return navigator.locks.request(name, { ifAvailable: true }, async (lock) => {
          if (!lock) return fn();
          return fn();
        });
      }
    }
  }
);

export const getCurrentShopId = async () => {
  const { data, error } = await supabase.from('shops').select('id').limit(1).single();
  if (error) {
    console.error("Shop ID取得エラー");
    return null;
  }
  return data.id;
};