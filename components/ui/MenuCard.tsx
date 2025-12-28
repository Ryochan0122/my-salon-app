// components/ui/MenuCard.tsx
import React, { ReactNode } from 'react';

interface MenuCardProps {
  icon: ReactNode;
  title: string;
  desc: string;
  color: string;
  onClick: () => void;
}

export const MenuCard = ({ icon, title, desc, color, onClick }: MenuCardProps) => (
  <button 
    onClick={onClick} 
    className="bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-700 hover:border-indigo-400 hover:bg-slate-700/50 transition-all flex flex-col items-center text-center group w-full"
  >
    <div className={`w-16 h-16 ${color} text-white rounded-2xl flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-all`}>
      {icon}
    </div>
    <h2 className="text-xl font-black text-white">{title}</h2>
    <p className="text-slate-500 text-xs font-bold">{desc}</p>
  </button>
);