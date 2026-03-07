"use client";
import React from 'react';
import { Staff, Appointment } from '@/types';
import { AppointmentCard } from './AppointmentCard';
import { Plus } from 'lucide-react';

interface FreeSlot {
  start: Date;
  duration: number;
}

interface StaffColor {
  bar: string;
  light: string;
  text: string;
  border: string;
  card: string;
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
  staffColor?: StaffColor;
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
  onAddAtTime,
  staffColor
}: Props) => {
  const START_HOUR = 9;
  const END_HOUR = 21;
  const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; 

  const getFreeSlots = (): FreeSlot[] => {
    const sortedApps = [...appointments].sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const slots: FreeSlot[] = [];
    let lastEndTime = new Date(selectedDate);
    lastEndTime.setHours(START_HOUR, 0, 0, 0);

    const businessEnd = new Date(selectedDate);
    businessEnd.setHours(END_HOUR, 0, 0, 0);

    const appsWithEnd = [...sortedApps, { start_time: businessEnd.toISOString() }];
    
    appsWithEnd.forEach((app) => {
      const currentStart = new Date(app.start_time);
      const diffMinutes = (currentStart.getTime() - lastEndTime.getTime()) / (1000 * 60);

      if (diffMinutes >= 30) {
        slots.push({ start: new Date(lastEndTime), duration: diffMinutes });
      }
      
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
    <div className="relative h-full w-full group min-h-[130px]">
      
      {/* 空き時間ガイド */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {freeSlots.map((slot, idx) => {
          const startMinutes = (slot.start.getHours() - START_HOUR) * 60 + slot.start.getMinutes();
          const leftPos = (startMinutes / TOTAL_MINUTES) * 100;
          const widthSize = (slot.duration / TOTAL_MINUTES) * 100;

          return (
            <button
              key={`free-${idx}`}
              onClick={() => onAddAtTime?.(member.id, selectedDate, slot.start.toTimeString().slice(0, 5))}
              className="absolute top-3 bottom-3 border border-dashed border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/5 hover:border-white/20 transition-all pointer-events-auto flex flex-col items-center justify-center group/slot overflow-hidden"
              style={{ left: `${leftPos}%`, width: `${widthSize - 0.5}%` }}
            >
              <div className="flex flex-col items-center opacity-0 group-hover/slot:opacity-100 transition-all translate-y-2 group-hover/slot:translate-y-0">
                <div className="p-1.5 bg-white/10 text-white/60 rounded-full mb-1">
                  <Plus size={12} strokeWidth={3} />
                </div>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest whitespace-nowrap">
                  {slot.duration}min
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ドロップ＋クリックグリッド */}
      <div className="absolute inset-0 flex z-10 pointer-events-none">
        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
          <div key={i} className="flex-1 flex pointer-events-auto">
            <div 
              className="flex-1 h-full hover:bg-white/[0.02] transition-colors cursor-pointer" 
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }} 
              onDrop={(e) => handleDrop(e, START_HOUR + i, 0)}
              onClick={() => onAddAtTime?.(member.id, selectedDate, `${(START_HOUR + i).toString().padStart(2, '0')}:00`)}
            />
            <div 
              className="flex-1 h-full hover:bg-white/[0.02] transition-colors cursor-pointer" 
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }} 
              onDrop={(e) => handleDrop(e, START_HOUR + i, 30)}
              onClick={() => onAddAtTime?.(member.id, selectedDate, `${(START_HOUR + i).toString().padStart(2, '0')}:30`)}
            />
          </div>
        ))}
      </div>

      {/* 予約カード */}
      <div className="relative h-full w-full z-20 min-h-[130px] pointer-events-none flex items-center">
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
              className="absolute h-[85%] px-1 transition-all duration-500 pointer-events-auto"
              style={{ left: `${leftPos}%`, width: `${widthSize}%`, minWidth: '130px' }}
            >
              <AppointmentCard 
                app={app} 
                onPay={onPay} 
                onEdit={onEdit} 
                onDelete={onDelete} 
                onShowChart={onShowChart}
                staffColor={staffColor}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};