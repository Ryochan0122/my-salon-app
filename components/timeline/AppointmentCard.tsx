"use client";
import React from 'react';
import { Appointment } from '@/types';
import { Clock, DollarSign, Trash2, GripVertical } from 'lucide-react';

interface Props {
  app: Appointment;
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
}

export const AppointmentCard = ({ app, onPay, onEdit, onDelete }: Props) => {
  const time = new Date(app.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // 【100機能：ドラッグ開始時の処理】
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("appointmentId", app.id);
    e.dataTransfer.effectAllowed = "move";
    
    // ドラッグ中の見た目を少し透過させる（オプション）
    const target = e.target as HTMLElement;
    target.style.opacity = "0.5";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
  };

  return (
    <div 
      draggable // これでドラッグ可能に
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEdit(app)}
      className="group relative w-full h-full bg-white border-2 border-slate-100 p-4 rounded-[1.5rem] shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all cursor-grab active:cursor-grabbing overflow-hidden flex flex-col justify-between"
    >
      {/* 左端のカラーバー */}
      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
      
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-1.5 text-indigo-600 font-black text-[10px] bg-indigo-50 px-2 py-0.5 rounded-full">
          <Clock size={10} /> {time}
        </div>
        
        {/* 操作ボタンエリア */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPay(app);
            }}
            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
          >
            <DollarSign size={12} />
          </button>
          
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if(window.confirm(`${app.customer_name} 様の予約を削除しますか？`)) {
                onDelete(app.id);
              }
            }}
            className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-black text-slate-900 text-sm leading-tight truncate">{app.customer_name} 様</h4>
        <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider truncate">{app.menu_name}</p>
      </div>

      {/* ドラッグ用のハンドルアイコン（視覚的なガイド） */}
      <div className="absolute bottom-2 right-2 text-slate-200 group-hover:text-slate-400 transition-colors">
        <GripVertical size={14} />
      </div>
    </div>
  );
};