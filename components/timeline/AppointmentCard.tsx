"use client";
import React from 'react';
import { Appointment } from '@/types';
import { Clock, DollarSign, Trash2, GripVertical, FileText, User } from 'lucide-react';

interface Props {
  app: Appointment;
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onShowChart: (name: string, id?: string) => void; // customer_idも渡せるように拡張
}

export const AppointmentCard = ({ app, onPay, onEdit, onDelete, onShowChart }: Props) => {
  // 時間表示の整形
  const startTime = new Date(app.start_time).toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  // メニュー別テーマカラーの定義（Aura Evolution Palette）
  const getTheme = (menu: string) => {
    const m = menu.toLowerCase();
    if (m.includes('カット')) return { bar: 'bg-indigo-500', bg: 'bg-indigo-50/50', text: 'text-indigo-700', icon: 'bg-indigo-100' };
    if (m.includes('カラー')) return { bar: 'bg-rose-500', bg: 'bg-rose-50/50', text: 'text-rose-700', icon: 'bg-rose-100' };
    if (m.includes('パーマ')) return { bar: 'bg-amber-500', bg: 'bg-amber-50/50', text: 'text-amber-700', icon: 'bg-amber-100' };
    if (m.includes('縮毛') || m.includes('ストレート')) return { bar: 'bg-emerald-500', bg: 'bg-emerald-50/50', text: 'text-emerald-700', icon: 'bg-emerald-100' };
    if (m.includes('トリートメント') || m.includes('スパ')) return { bar: 'bg-sky-500', bg: 'bg-sky-50/50', text: 'text-sky-700', icon: 'bg-sky-100' };
    return { bar: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-600', icon: 'bg-slate-100' };
  };

  const theme = getTheme(app.menu_name);

  return (
    <div 
      draggable 
      onDragStart={(e) => {
        e.dataTransfer.setData("appointmentId", app.id);
        // ドラッグ中のゴースト要素のスタイル
        const ghost = e.currentTarget as HTMLElement;
        ghost.style.opacity = "0.5";
        ghost.style.transform = "scale(0.95)";
      }}
      onDragEnd={(e) => {
        const ghost = e.currentTarget as HTMLElement;
        ghost.style.opacity = "1";
        ghost.style.transform = "scale(1)";
      }}
      className={`group relative w-full h-full bg-white border border-slate-100 rounded-[1.2rem] shadow-sm hover:shadow-2xl hover:border-indigo-300 hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing overflow-hidden flex flex-col p-2.5`}
    >
      {/* 左端のアクセントバー */}
      <div className={`absolute top-0 left-0 w-1 h-full ${theme.bar} transition-all group-hover:w-1.5`} />
      
      {/* ヘッダー：時間とアイコン */}
      <div className="flex justify-between items-start mb-1">
        <div className={`flex items-center gap-1.5 font-black text-[9px] ${theme.text} bg-white shadow-sm border border-slate-50 px-2 py-0.5 rounded-full z-10`}>
          <Clock size={10} className="animate-pulse" />
          {startTime}
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={12} className="text-slate-300" />
        </div>
      </div>

      {/* メイン情報：クリックで編集 */}
      <div className="flex-1 min-w-0 cursor-pointer z-10" onClick={() => onEdit(app)}>
        <h4 className="font-black text-slate-900 text-[11px] leading-tight truncate flex items-center gap-1">
          <span className="truncate">{app.customer_name}</span>
          <span className="text-[8px] font-normal text-slate-400">様</span>
        </h4>
        <p className={`font-black text-[8px] uppercase tracking-tighter truncate mt-0.5 ${theme.text} opacity-80`}>
          {app.menu_name}
        </p>
      </div>

      {/* アクションツールバー：マウスホバーで強調表示 */}
      <div className="mt-2 flex items-center justify-end gap-1 translate-y-1 group-hover:translate-y-0 transition-transform">
        {/* カルテボタン */}
        <button 
          title="Medical Record"
          onClick={(e) => { e.stopPropagation(); onShowChart(app.customer_name, app.customer_id); }}
          className="p-1.5 bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
        >
          <FileText size={12} />
        </button>
        
        {/* 会計ボタン */}
        <button 
          title="Checkout"
          onClick={(e) => { e.stopPropagation(); onPay(app); }}
          className="p-1.5 bg-slate-50 text-slate-400 hover:bg-emerald-600 hover:text-white rounded-lg transition-all"
        >
          <DollarSign size={12} />
        </button>

        {/* 削除ボタン（確認が必要なため赤色はホバー時のみ） */}
        <button 
          title="Cancel"
          onClick={(e) => { e.stopPropagation(); onDelete(app.id); }}
          className="p-1.5 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* 背景の薄いカラー装飾 */}
      <div className={`absolute -right-4 -bottom-4 w-12 h-12 ${theme.bg} rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />
    </div>
  );
};