"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Zap, Mail, Lock, Store, UserPlus, LogIn, Loader2 } from 'lucide-react';

export const AuthView = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              shop_name: shopName || 'My New Salon',
              invite_code: inviteCode || null,
            }
          }
        });
        if (error) throw error;
        alert('確認メールを送信しました（設定によっては即ログイン可能です）');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 p-12 border border-slate-50">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-6 shadow-lg shadow-indigo-200">
            <Zap className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">
            Aura <span className="text-indigo-600">OS</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-2">
            {isSignUp ? 'アカウント新規登録' : 'ログイン'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">メールアドレス</label>
            <div className="relative">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-sm focus:ring-2 ring-indigo-500 outline-none transition-all"
                placeholder="salon@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">パスワード</label>
            <div className="relative">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-sm focus:ring-2 ring-indigo-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {isSignUp && (
            <div className="pt-4 space-y-4 animate-in slide-in-from-top duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-600 uppercase ml-4">サロン名</label>
                <div className="relative">
                  <Store className="absolute left-6 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
                  <input 
                    type="text" value={shopName} onChange={(e) => setShopName(e.target.value)}
                    className="w-full bg-indigo-50/50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-sm focus:ring-2 ring-indigo-500 outline-none transition-all"
                    placeholder="AURA サロン 渋谷店"
                  />
                </div>
              </div>
              <p className="text-center text-[9px] font-bold text-slate-300 uppercase tracking-tighter">— または —</p>
              <input 
                type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-xs focus:ring-2 ring-slate-200 outline-none text-center"
                placeholder="招待コード（お持ちの方）"
              />
            </div>
          )}

          <button 
            disabled={loading}
            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 mt-8"
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? <><UserPlus size={18}/> アカウント作成</> : <><LogIn size={18}/> ログイン</>)}
          </button>
        </form>

        <button 
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
        >
          {isSignUp ? 'すでにアカウントをお持ちの方はこちら' : '新規登録はこちら'}
        </button>
      </div>
    </div>
  );
};