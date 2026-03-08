import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const getCurrentShopId = async () => {
  const { data, error } = await supabase.from('shops').select('id').limit(1).single();
  if (error) {
    console.error("Shop ID取得エラー");
    return null;
  }
  return data.id;
};