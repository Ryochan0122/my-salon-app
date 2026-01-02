"use client";
import React from 'react';
import { Appointment } from '@/types';
import { Clock, DollarSign, Trash2, GripVertical, FileText } from 'lucide-react';

interface Props {
  app: Appointment;
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onShowChart: (name: string) => void; // 追加
}

export const AppointmentCard = ({ app, onPay, onEdit, onDelete, onShowChart }: Props) => {
  const time = new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // メニュー別カラー判別
  const getTheme = (menu: string) => {
    const m = menu.toLowerCase();
    if (m.includes('カット')) return { bar: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-600' };
    if (m.includes('カラー')) return { bar: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' };
    if (m.includes('パーマ')) return { bar: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-600' };
    if (m.includes('ストレート') || m.includes('縮毛')) return { bar: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-600' };
    if (m.includes('トリートメント') || m.includes('スパ')) return { bar: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600' };
    return { bar: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600' };
  };

  const theme = getTheme(app.menu_name);

  return (
    <div 
      draggable 
      onDragStart={(e) => {
        e.dataTransfer.setData("appointmentId", app.id);
        (e.currentTarget as HTMLElement).style.opacity = "0.4";
      }}
      onDragEnd={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}
      className="group relative w-full h-full bg-white border-2 border-slate-100 p-3 rounded-[1.2rem] shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all cursor-grab active:cursor-grabbing overflow-hidden flex flex-col justify-between"
    >
      <div className={`absolute top-0 left-0 w-1.5 h-full ${theme.bar} z-10`} />
      
      <div className="flex justify-between items-start">
        <div className={`flex items-center gap-1 ${theme.text} font-black text-[9px] ${theme.bg} px-2 py-0.5 rounded-full z-10`}>
          <Clock size={10} /> {time}
        </div>
      </div>

      <div className="flex-1 min-w-0 mt-1 cursor-pointer z-10" onClick={() => onEdit(app)}>
        <h4 className="font-black text-slate-900 text-xs leading-tight truncate">{app.customer_name} 様</h4>
        <p className={`${theme.text} font-bold text-[8px] uppercase tracking-wider truncate`}>{app.menu_name}</p>
      </div>

      <div className="absolute bottom-2 right-2 flex gap-1 z-20">
        {/* カルテボタン */}
        <button 
          onClick={(e) => { e.stopPropagation(); onShowChart(app.customer_name); }}
          className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all shadow-sm"
        >
          <FileText size={12} />
        </button>
        {/* 会計ボタン */}
        <button 
          onClick={(e) => { e.stopPropagation(); onPay(app); }}
          className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-sm"
        >
          <DollarSign size={12} />
        </button>
        {/* 削除ボタン */}
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(app.id); }}
          className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all shadow-sm"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="absolute bottom-2 left-3 text-slate-200 group-hover:text-slate-300">
        <GripVertical size={12} />
      </div>
    </div>
  );
};