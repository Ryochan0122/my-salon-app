"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Scissors, Loader2, UserPlus, LogIn, KeyRound, ArrowLeft, Save, Hash, Store } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'reset' | 'update_password';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<AuthMode>('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // 【追加】新規登録時に必要な情報
  const [inviteCode, setInviteCode] = useState(''); 
  const [shopName, setShopName] = useState('');
  const [isNewShop, setIsNewShop] = useState(false); // 新規作成か既存参加か

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
        // 【重要】メタデータに invite_code または shop_name を含める
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              invite_code: isNewShop ? null : inviteCode.trim().toUpperCase(),
              shop_name: isNewShop ? shopName : null,
            }
          }
        });
        if (error) throw error;
        setMessage({ text: "確認メールを送信しました。", type: 'success' });
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}`, 
        });
        if (error) throw error;
        setMessage({ text: "メールを送信しました。", type: 'success' });
      } else if (mode === 'update_password') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage({ text: "更新しました。", type: 'success' });
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
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4">
              <Scissors size={28} />
            </div>
            <h2 className="text-2xl font-black italic text-slate-900 tracking-tighter uppercase">
              {mode === 'signup' ? (isNewShop ? 'Create Shop' : 'Join Shop') : 'Aura Access'}
            </h2>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {mode !== 'update_password' && (
              <input 
                type="email" placeholder="メールアドレス" required
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 text-sm"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            )}

            {/* --- 新規登録時の拡張フィールド --- */}
            {mode === 'signup' && (
              <>
                <div className="flex bg-slate-100 p-1 rounded-xl mb-2">
                  <button 
                    type="button" onClick={() => setIsNewShop(false)}
                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${!isNewShop ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                  >既存店舗に参加</button>
                  <button 
                    type="button" onClick={() => setIsNewShop(true)}
                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${isNewShop ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
                  >新しく店を作る</button>
                </div>

                {isNewShop ? (
                  <div className="relative">
                    <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" placeholder="店名（例: Salon Aura）" required
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm"
                      value={shopName} onChange={(e) => setShopName(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                    <input 
                      type="text" placeholder="店舗コード" required
                      className="w-full pl-12 pr-6 py-4 bg-indigo-50 border-2 border-indigo-100 rounded-2xl font-black text-sm uppercase"
                      value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}
            {/* ---------------------------- */}
            
            {mode !== 'reset' && (
              <input 
                type="password" placeholder="パスワード" required
                className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-600 text-sm"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            )}

            {message && (
              <div className={`p-4 rounded-2xl text-[11px] font-bold text-center ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {message.text}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">
              {mode === 'signup' ? <><UserPlus size={18} /> 登録して開始</> : <LogIn size={18} />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(null); }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">
              {mode === 'login' ? '新規アカウント作成' : 'ログインに戻る'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};