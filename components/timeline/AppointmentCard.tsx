"use client";
import React, { useState } from 'react';
import { Appointment } from '@/types';
import { Clock, DollarSign, Trash2, GripVertical, FileText, MessageSquare, AlertTriangle } from 'lucide-react';

interface StaffColor {
  bar: string;
  light: string;
  text: string;
  border: string;
  card: string;
}

interface Props {
  app: Appointment;
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onShowChart: (name: string) => void;
  staffColor?: StaffColor;
}

export const AppointmentCard = ({ app, onPay, onEdit, onDelete, onShowChart, staffColor }: Props) => {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const time = new Date(app.start_time).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

  const color = staffColor || {
    bar: 'bg-violet-500',
    light: 'bg-violet-500/20',
    text: 'text-violet-300',
    border: 'border-violet-500/30',
    card: 'from-violet-900/40'
  };

  if (confirmingDelete) {
    return (
      <div className="w-full h-full bg-rose-950/80 border border-rose-500/30 rounded-2xl flex flex-col items-center justify-center p-3 gap-2 animate-in zoom-in-95 duration-200">
        <AlertTriangle size={14} className="text-rose-400" />
        <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest">削除しますか？</p>
        <div className="flex gap-2 w-full">
          <button onClick={() => onDelete(app.id)} className="flex-1 py-1.5 bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase hover:bg-rose-600 transition-all">削除</button>
          <button onClick={() => setConfirmingDelete(false)} className="flex-1 py-1.5 bg-white/5 text-white/40 rounded-lg text-[9px] font-black uppercase hover:bg-white/10 transition-all">戻る</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      draggable 
      onDragStart={(e) => {
        e.dataTransfer.setData("appointmentId", app.id);
        (e.currentTarget as HTMLElement).style.opacity = "0.3";
      }}
      onDragEnd={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}
      className={`group relative w-full h-full bg-gradient-to-b ${color.card} to-slate-800/60 border ${color.border} rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-grab active:cursor-grabbing overflow-hidden flex flex-col p-3 backdrop-blur-sm`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${color.bar} z-10`} />
      
      <div className="flex justify-between items-start mb-2 pl-2">
        <div className={`flex items-center gap-1 ${color.text} font-black text-[9px] ${color.light} px-2 py-0.5 rounded-full border ${color.border}`}>
          <Clock size={10} strokeWidth={3} /> {time}
        </div>
        <GripVertical size={14} className="text-white/10 group-hover:text-white/30 transition-colors" />
      </div>

      <div className="flex-1 min-w-0 pl-2 cursor-pointer" onClick={() => onEdit(app)}>
        <h4 className="font-black text-white text-sm leading-tight tracking-tight truncate">
          {app.customer_name}
          <span className="text-[9px] text-white/30 font-bold ml-1">様</span>
        </h4>
        <p className={`${color.text} font-black text-[9px] tracking-wider mt-0.5 uppercase opacity-80 truncate`}>
          {app.menu_name}
        </p>
        {app.memo && (
          <div className="flex items-center gap-1 mt-1 text-white/30">
            <MessageSquare size={9} />
            <p className="text-[8px] font-medium leading-tight truncate italic">{app.memo}</p>
          </div>
        )}
      </div>

      <div className="flex gap-1 mt-2 pl-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onShowChart(app.customer_name); }}
          className="flex-1 flex justify-center py-1.5 bg-white/5 text-white/40 rounded-lg hover:bg-white/10 hover:text-white transition-all"
        >
          <FileText size={12} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onPay(app); }}
          className={`flex-1 flex justify-center py-1.5 ${color.light} ${color.text} rounded-lg hover:opacity-80 transition-all border ${color.border}`}
        >
          <DollarSign size={12} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
          className="py-1.5 px-2 bg-white/5 text-white/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};