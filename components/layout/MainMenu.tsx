"use client";
import React from 'react';
import { 
  Calendar, 
  CreditCard, 
  Settings, 
  ArrowRight, 
  LucideIcon, 
  Users, 
  Zap, 
  TrendingUp
} from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
}

const LocalMenuCard = ({ 
  icon: Icon, 
  title, 
  desc, 
  color, 
  onClick 
}: { 
  icon: LucideIcon, 
  title: string, 
  desc: string, 
  color: string, 
  onClick: () => void 
}) => (
  <button 
    onClick={onClick}
    className="group relative overflow-hidden bg-white/[0.03] border border-white/5 rounded-[3rem] p-10 text-left transition-all hover:bg-white/[0.08] hover:scale-[1.03] active:scale-95 shadow-2xl backdrop-blur-md"
  >
    <div className={`w-16 h-16 ${color} text-white rounded-[1.5rem] flex items-center justify-center mb-8 shadow-2xl group-hover:rotate-12 transition-all duration-500 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`}>
      <Icon size={32} />
    </div>
    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{title}</h3>
    <p className="text-slate-500 text-[11px] font-bold tracking-[0.1em] mt-2 mb-8">{desc}</p>
    
    <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
      画面を開く <ArrowRight size={14} />
    </div>

    {/* 背景の装飾的なグラデーション */}
    <div className={`absolute -right-8 -bottom-8 w-32 h-32 ${color} opacity-10 rounded-full blur-[60px] group-hover:opacity-30 transition-opacity duration-700`} />
  </button>
);

export const MainMenu = ({ onNavigate }: Props) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] px-6 py-20 selection:bg-indigo-500 relative overflow-hidden">
      
      {/* 背景の環境光イメージ */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-900/10 blur-[120px] rounded-full" />

      <div className="max-w-[1400px] w-full relative z-10">
        <header className="text-center mb-28 animate-in fade-in slide-in-from-top-12 duration-1000">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/5 border border-white/10 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-10 backdrop-blur-sm">
            <Zap size={12} className="fill-indigo-400" /> システム稼働中 v2.0.1
          </div>
          
          <h1 className="text-8xl md:text-9xl font-black text-white italic tracking-tighter mb-8 uppercase leading-none">
            AURA <span className="text-indigo-600 drop-shadow-[0_0_30px_rgba(79,70,229,0.4)]">STUDIO</span>
          </h1>
          
          <p className="text-slate-500 text-xs font-bold tracking-[0.4em] mb-12">
            サロン経営・顧客管理システム
          </p>
          
          <div className="h-px w-48 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto opacity-50" />
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <LocalMenuCard 
            icon={Calendar} 
            title="予約" 
            desc="予約状況の確認・登録" 
            color="bg-indigo-600" 
            onClick={() => onNavigate('calendar')} 
          />
          <LocalMenuCard 
            icon={Users} 
            title="顧客" 
            desc="顧客情報の管理・検索" 
            color="bg-amber-500" 
            onClick={() => onNavigate('customers')} 
          />
          <LocalMenuCard 
            icon={TrendingUp} 
            title="売上" 
            desc="売上履歴・データの確認" 
            color="bg-rose-500" 
            onClick={() => onNavigate('sales')} 
          />
          <LocalMenuCard 
            icon={CreditCard} 
            title="レジ" 
            desc="会計・支払い処理" 
            color="bg-emerald-600" 
            onClick={() => onNavigate('sales')} 
          />
          <LocalMenuCard 
            icon={Settings} 
            title="設定" 
            desc="メニュー・スタッフ設定" 
            color="bg-slate-700" 
            onClick={() => onNavigate('settings')} 
          />
        </div>

        <footer className="mt-32 flex flex-col items-center gap-6 border-t border-white/5 pt-16">
          <div className="flex flex-wrap justify-center items-center gap-10">
            <StatusBadge color="bg-emerald-500" label="データベース 接続済み" />
            <StatusBadge color="bg-indigo-500" label="分析エンジン 正常稼働" />
            <StatusBadge color="bg-rose-500" label="セキュリティ 適用中" />
          </div>
          <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest mt-4">
            &copy; 2026 AURA STUDIO. 無断複写・転載を禁じます
          </p>
        </footer>
      </div>
    </div>
  );
};

const StatusBadge = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-3">
    <div className={`w-1.5 h-1.5 ${color} rounded-full animate-pulse shadow-[0_0_10px_currentColor]`} />
    <span className="text-[10px] font-black text-slate-500 tracking-[0.1em]">{label}</span>
  </div>
);