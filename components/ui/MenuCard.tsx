// components/ui/MenuCard.tsx
import React, { ReactNode } from 'react';

interface MenuCardProps {
  icon: ReactNode;
  title: string;
  desc: string;
  color: string;
  onClick: () => void;
}

/**
 * メニュー選択等で使用する汎用カードコンポーネント
 */
export const MenuCard = ({ icon, title, desc, color, onClick }: MenuCardProps) => (
  <button 
    onClick={onClick} 
    className="bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-700 hover:border-indigo-400 hover:bg-slate-700/50 transition-all flex flex-col items-center text-center group w-full"
  >
    {/* アイコン表示エリア：ホバー時に少し拡大するアニメーション付き */}
    <div className={`w-16 h-16 ${color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-all`}>
      {icon}
    </div>
    
    {/* タイトル：メインの機能名 */}
    <h2 className="text-xl font-black text-white">{title}</h2>
    
    {/* 説明文：機能の短い補足 */}
    <p className="text-slate-500 text-xs font-bold mt-1">{desc}</p>
  </button>
);