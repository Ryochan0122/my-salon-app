"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Scissors, Loader2, UserPlus, LogIn, KeyRound, ArrowLeft, Save, Hash } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'reset' | 'update_password';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AuthMode>('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState(''); // 👈 店舗コード用
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const syncShopId = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('shop_id').eq('id', userId).single();
    if (data?.shop_id) {
      localStorage.setItem('aura_shop_id', data.shop_id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) syncShopId(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') setMode('update_password');
      
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        await syncShopId(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('aura_shop_id');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        // 👈 invite_code をメタデータとして送信
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              invite_code: inviteCode.trim().toUpperCase() // 大文字で統一
            }
          }
        });
        if (error) throw error;
        setMessage({ text: "確認メールを送信しました。リンクをクリックしてください。", type: 'success' });
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`, 
        });
        if (error) throw error;
        setMessage({ text: "再設定用メールを送信しました。", type: 'success' });
      } else if (mode === 'update_password') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage({ text: "完了しました。ダッシュボードへ移動します...", type: 'success' });
        setTimeout(() => setMode('login'), 1500);
      }
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !session) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!session || mode === 'update_password') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-6">
        <div className="w-full max-w-md bg-white rounded-[3rem] p-12 shadow-2xl relative">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-100">
              <Scissors size={28} />
            </div>
            <h2 className="text-2xl font-black italic text-slate-900 tracking-tighter uppercase text-center">
              {mode === 'update_password' ? 'New Password' : 
               mode === 'reset' ? 'Reset Access' : 
               mode === 'signup' ? 'Join Shop' : 'Welcome Back'}
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
              {mode === 'signup' ? '店舗コードを入力して登録' : '関係者専用アクセス'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode !== 'update_password' && (
              <input 
                type="email" 
                placeholder="メールアドレス"
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}

            {/* 👈 新規登録時のみ表示される店舗コード入力欄 */}
            {mode === 'signup' && (
              <div className="relative">
                <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400" size={16} />
                <input 
                  type="text" 
                  placeholder="店舗コード (例: XT92B1)"
                  className="w-full pl-12 pr-6 py-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl font-black focus:ring-2 focus:ring-indigo-600 text-sm placeholder:text-indigo-300 uppercase"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
              </div>
            )}
            
            {mode !== 'reset' && (
              <div className="space-y-2">
                <input 
                  type="password" 
                  placeholder={mode === 'update_password' ? "新しいパスワード" : "パスワード"}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {mode === 'login' && (
                  <div className="text-right">
                    <button type="button" onClick={() => setMode('reset')} className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase">
                      パスワードを忘れた
                    </button>
                  </div>
                )}
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-2xl text-[11px] font-bold text-center ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50">
              {mode === 'signup' ? <><UserPlus size={18} /> 店舗に参加する</> : <LogIn size={18} />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center flex flex-col gap-4">
            {mode === 'login' ? (
              <button onClick={() => setMode('signup')} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                新規登録（店舗コードをお持ちの方）
              </button>
            ) : (
              <button onClick={() => setMode('login')} className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <ArrowLeft size={14} /> ログインに戻る
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};