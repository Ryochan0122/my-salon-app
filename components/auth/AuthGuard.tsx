"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Scissors, Loader2 } from 'lucide-react';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // セッション状態の監視
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("ログインに失敗しました: " + error.message);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-6">
        <div className="w-full max-w-md bg-white rounded-[3rem] p-12 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl shadow-indigo-200">
              <Scissors size={32} />
            </div>
            <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter uppercase">Salon Pro Manager</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">関係者専用アクセス</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="email" 
                placeholder="メールアドレス"
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 transition-all text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input 
                type="password" 
                placeholder="パスワード"
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 transition-all text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl mt-4"
            >
              <Lock size={18} />
              <span>ダッシュボードにログイン</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};