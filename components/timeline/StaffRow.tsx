"use client";
import React from 'react';
import { Staff, Appointment } from '@/types';
import { AppointmentCard } from './AppointmentCard';

interface Props {
  member: Staff;
  appointments: Appointment[];
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
  // Board.tsx から渡される新プロパティ
  onMoveApp: (appId: string, newStartTime: string) => Promise<void>;
}

export const StaffRow = ({ member, appointments, onPay, onEdit, onDelete, onMoveApp }: Props) => {
  // 9:00から21:00までの12時間軸を表示
  const hours = Array.from({ length: 13 }, (_, i) => i + 9);

  // 【100機能：ドロップされた場所から時間を算出】
  const handleDrop = (e: React.DragEvent, hour: number, minute: number = 0) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("appointmentId");
    if (!appId) return;

    // ドロップされた時間のDateオブジェクトを作成
    const now = new Date();
    const newStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
    
    onMoveApp(appId, newStart.toISOString());
  };

  return (
    <div className="flex group min-h-[160px] relative border-b border-slate-50">
      
      {/* LEFT: Staff Info (固定カラム) */}
      <div className="w-48 p-8 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50/80 transition-colors z-20 flex flex-col justify-center shrink-0">
        <div className="w-12 h-12 bg-slate-900 rounded-2xl mb-2 flex items-center justify-center text-white font-black text-lg shadow-lg">
          {member.name[0]}
        </div>
        <p className="font-black text-slate-900 italic tracking-tighter text-lg leading-tight truncate">{member.name}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Stylist</p>
      </div>
      
      {/* RIGHT: Scrollable Timeline Area */}
      <div className="flex-1 relative bg-slate-50/30 group-hover:bg-white transition-colors overflow-hidden min-w-[1200px]">
        
        {/* 背景のグリッド（1時間ごとのドロップ領域） */}
        <div className="absolute inset-0 flex">
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex-1 border-l border-slate-100/50 relative group/slot"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, hour)}
            >
              <span className="absolute top-2 left-2 text-[8px] font-black text-slate-200 uppercase">{hour}:00</span>
              
              {/* 30分単位のドロップ補助領域 */}
              <div 
                className="absolute inset-y-0 left-1/2 w-px border-l border-slate-200/30 border-dashed hover:bg-indigo-50/50 transition-colors cursor-pointer"
                onDrop={(e) => {
                  e.stopPropagation();
                  handleDrop(e, hour, 30);
                }}
              />
            </div>
          ))}
        </div>

        {/* 予約カードの絶対配置描画 */}
        <div className="relative h-full w-full">
          {appointments.map((app) => {
            const start = new Date(app.start_time);
            const end = new Date(app.end_time);
            
            // 9:00を起点とした位置計算 (12時間 = 720分)
            const startMinutes = (start.getHours() - 9) * 60 + start.getMinutes();
            const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
            
            const leftPos = (startMinutes / (12 * 60)) * 100;
            const widthPos = (durationMinutes / (12 * 60)) * 100;

            return (
              <div
                key={app.id}
                className="absolute top-1/2 -translate-y-1/2 h-[80%] z-10 px-1 transition-all"
                style={{ 
                  left: `${leftPos}%`, 
                  width: `${widthPos}%`,
                  minWidth: '120px' 
                }}
              >
                <AppointmentCard 
                  app={app} 
                  onPay={onPay} 
                  onEdit={onEdit}
                  onDelete={onDelete} 
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};