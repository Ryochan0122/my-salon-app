"use client";
import React from 'react';
import { Calendar, Camera, CreditCard, Settings, ArrowRight, LucideIcon } from 'lucide-react';

interface Props {
  onNavigate: (view: string) => void;
}

// 内部用MenuCardコンポーネント
// icon の型を React.ReactNode から LucideIcon に変更
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
    className="group relative overflow-hidden bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-left transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-95 shadow-2xl"
  >
    <div className={`w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-12 transition-transform`}>
      {/* cloneElementを使わず、コンポーネントとして直接描画 */}
      <Icon size={28} />
    </div>
    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{title}</h3>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 mb-6">{desc}</p>
    
    <div className="flex items-center gap-2 text-indigo-400 font-black text-[10px] uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
      Open Module <ArrowRight size={12} />
    </div>

    {/* 装飾用背景 */}
    <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
  </button>
);

export const MainMenu = ({ onNavigate }: Props) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-6 py-20 selection:bg-indigo-500">
      <div className="max-w-6xl w-full">
        <header className="text-center mb-24 animate-in fade-in slide-in-from-top-8 duration-1000">
          <div className="inline-block px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            Enterprise Edition 2025
          </div>
          <h1 className="text-7xl md:text-8xl font-black text-white italic tracking-tighter mb-6 uppercase">
            Salonfactory <span className="text-indigo-500">PRO</span>
          </h1>
          <div className="h-1.5 w-32 bg-indigo-600 mx-auto rounded-full shadow-[0_0_20px_rgba(79,70,229,0.6)]" />
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          {/* アイコンは <Calendar/> ではなく Calendar (コンポーネントそのもの) を渡す */}
          <LocalMenuCard 
            icon={Calendar} 
            title="予約" 
            desc="Timeline" 
            color="bg-indigo-600" 
            onClick={() => onNavigate('calendar')} 
          />
          <LocalMenuCard 
            icon={Camera} 
            title="カルテ" 
            desc="Digital Records" 
            color="bg-rose-500" 
            onClick={() => onNavigate('chart')} 
          />
          <LocalMenuCard 
            icon={CreditCard} 
            title="レジ" 
            desc="POS System" 
            color="bg-emerald-600" 
            onClick={() => onNavigate('sales')} 
          />
          <LocalMenuCard 
            icon={Settings} 
            title="管理" 
            desc="Settings" 
            color="bg-slate-700" 
            onClick={() => onNavigate('settings')} 
          />
        </div>

        <footer className="mt-24 flex flex-col items-center gap-4 border-t border-white/5 pt-12">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Supabase Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AI Engine Ready</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};