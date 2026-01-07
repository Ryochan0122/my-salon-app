"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Scissors, Loader2, Store } from 'lucide-react';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shopCode, setShopCode] = useState(''); // 店舗コード
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // 1. セッションと保存済み店舗コードの確認
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const savedShop = localStorage.getItem('aura_shop_code');
      
      setSession(session);
      if (savedShop) setShopCode(savedShop);
      setLoading(false);
    };

    checkAuth();

    // 2. 状態変化の監視（ログアウト時などに反応）
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        // ログアウト時は店舗コード以外をクリア（店舗コードは利便性のため残すのもアリ）
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopCode) return alert("店舗コードを入力してください");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert("ログインに失敗しました: " + error.message);
    } else {
      // 成功時：店舗コードをブラウザに保存（次回から入力不要に）
      localStorage.setItem('aura_shop_code', shopCode);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  // ログインしていない場合の画面
  if (!session) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-6 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-[3rem] p-10 md:p-12 shadow-2xl my-8">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl shadow-indigo-200">
              <Scissors size={32} />
            </div>
            <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase text-center">Aura Salon Admin</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 border-b border-slate-100 pb-2">Persistent Session Access</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* 店舗コード入力：一度入れるとLocalStorageから自動補完 */}
            <div className="relative group">
              <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="店舗コード"
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm text-slate-900"
                value={shopCode}
                onChange={(e) => setShopCode(e.target.value)}
                required
              />
            </div>

            <div>
              <input 
                type="email" 
                placeholder="メールアドレス"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm text-slate-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="パスワード"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold focus:border-indigo-600 focus:bg-white outline-none transition-all text-sm text-slate-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="pt-2 text-center">
              <p className="text-[10px] text-slate-400 font-bold">
                ※一度ログインすると、30日間はこの端末でログインを保持します。
              </p>
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-600 active:scale-95 transition-all shadow-xl mt-4"
            >
              <Lock size={18} />
              <span>ダッシュボードを開く</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};