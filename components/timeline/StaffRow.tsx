"use client";
import React from 'react';
import { Staff, Appointment } from '@/types';
import { AppointmentCard } from './AppointmentCard';
import { Plus } from 'lucide-react';

// 空き時間スロットの型定義
interface FreeSlot {
  start: Date;
  duration: number;
}

interface Props {
  member: Staff;
  appointments: Appointment[];
  selectedDate: Date;
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onMoveApp: (appId: string, newStartTime: string) => Promise<void>;
  onShowChart: (name: string) => void;
  onAddAtTime?: (staffId: string, date: Date, time: string) => void;
  viewMode?: "horizontal" | "vertical";
}

export const StaffRow = ({ 
  member,
  appointments, 
  selectedDate, 
  onPay, 
  onEdit, 
  onDelete, 
  onMoveApp,
  onShowChart,
  onAddAtTime
}: Props) => {
  const START_HOUR = 9;
  const END_HOUR = 21;
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; 

  // --- 空き時間ガイドの計算ロジック ---
  const getFreeSlots = (): FreeSlot[] => {
    // 予約を開始時間順にソート
    const sortedApps = [...appointments].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const slots: FreeSlot[] = []; // 型を明示的に定義
    let lastEndTime = new Date(selectedDate);
    lastEndTime.setHours(START_HOUR, 0, 0, 0);

    const businessEnd = new Date(selectedDate);
    businessEnd.setHours(END_HOUR, 0, 0, 0);

    // 予約の隙間を抽出
    [...sortedApps, { start_time: businessEnd.toISOString() }].forEach((app) => {
      const currentStart = new Date(app.start_time);
      const diffMinutes = (currentStart.getTime() - lastEndTime.getTime()) / (1000 * 60);

      if (diffMinutes >= 30) { // 30分以上の空きがあれば表示
        slots.push({
          start: new Date(lastEndTime),
          duration: diffMinutes
        });
      }
      
      // Appointment型であるかチェックして終了時間を更新
      if ('end_time' in app && app.end_time) {
        const appEnd = new Date(app.end_time);
        if (appEnd > lastEndTime) lastEndTime = appEnd;
      }
    });

    return slots;
  };

  const freeSlots = getFreeSlots();

  const handleDrop = (e: React.DragEvent, hour: number, minute: number = 0) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("appointmentId");
    if (!appId) return;

    const newStart = new Date(selectedDate);
    newStart.setHours(hour, minute, 0, 0);
    onMoveApp(appId, newStart.toISOString());
  };

  return (
    <div className="relative h-full w-full group">
      {/* 1. 背景：空き時間ガイドレイヤー */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {freeSlots.map((slot, idx) => {
          const startMinutes = (slot.start.getHours() - START_HOUR) * 60 + slot.start.getMinutes();
          const leftPos = (startMinutes / TOTAL_MINUTES) * 100;
          const widthSize = (slot.duration / TOTAL_MINUTES) * 100;

          return (
            <button
              key={`free-${idx}`}
              onClick={() => onAddAtTime?.(member.id, selectedDate, slot.start.toTimeString().slice(0, 5))}
              className="absolute top-4 bottom-4 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/30 hover:bg-indigo-50/50 hover:border-indigo-200 transition-all pointer-events-auto flex flex-col items-center justify-center group/slot overflow-hidden"
              style={{ left: `${leftPos}%`, width: `${widthSize}%` }}
            >
              <div className="flex flex-col items-center opacity-0 group-hover/slot:opacity-100 transition-opacity">
                <Plus size={16} className="text-indigo-400 mb-1" />
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">
                  {slot.duration}min Free
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. ドロップ判定用グリッド（透明） */}
      <div className="absolute inset-0 flex z-10 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 flex pointer-events-auto">
            <div className="flex-1" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, START_HOUR + i, 0)} />
            <div className="flex-1" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, START_HOUR + i, 30)} />
          </div>
        ))}
      </div>

      {/* 3. 予約カードレイヤー */}
      <div className="relative h-full w-full z-20 min-h-[120px] pointer-events-none">
        {appointments.map((app) => {
          const start = new Date(app.start_time);
          const end = new Date(app.end_time);
          const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
          const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
          
          const leftPos = (startMinutes / TOTAL_MINUTES) * 100;
          const widthSize = (durationMinutes / TOTAL_MINUTES) * 100;

          return (
            <div
              key={app.id}
              className="absolute top-1/2 -translate-y-1/2 h-[80%] px-1 transition-all duration-300 pointer-events-auto"
              style={{ left: `${leftPos}%`, width: `${widthSize}%`, minWidth: '130px' }}
            >
              <div className="h-full">
                <AppointmentCard 
                  app={app} 
                  onPay={onPay} 
                  onEdit={onEdit} 
                  onDelete={onDelete} 
                  onShowChart={onShowChart} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};