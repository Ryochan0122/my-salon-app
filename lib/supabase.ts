import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * 現在の店舗IDを取得するヘルパー
 * 将来的にはログインユーザーの所属から取得しますが、
 * 現時点では最初の1件（メイン店舗）を返してエラーを防ぎます。
 */
export const getCurrentShopId = async () => {
  const { data, error } = await supabase.from('shops').select('id').limit(1).single();
  if (error) {
    console.error("Shop ID取得エラー: SQL Editorでshopsテーブルにデータを作成してください。");
    return null;
  }
  return data.id;
};