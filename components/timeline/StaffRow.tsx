"use client";
import React from 'react';
import { Staff, Appointment } from '@/types';
import { AppointmentCard } from './AppointmentCard';

interface Props {
  member: Staff;
  appointments: Appointment[];
  selectedDate: Date;
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onMoveApp: (appId: string, newStartTime: string) => Promise<void>;
  onShowChart: (name: string) => void;
  viewMode?: "horizontal" | "vertical"; // 将来的な拡張性のため
}

export const StaffRow = ({ 
  appointments, 
  selectedDate, 
  onPay, 
  onEdit, 
  onDelete, 
  onMoveApp,
  onShowChart
}: Props) => {
  // 9:00 - 21:00 (12時間 = 720分)
  const START_HOUR = 9;
  const TOTAL_MINUTES = 12 * 60; 

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
      {/* 1. 背景ドロップゾーン（30分刻みで判定） */}
      <div className="absolute inset-0 flex z-10 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => {
          const hour = START_HOUR + i;
          return (
            <div key={hour} className="flex-1 flex pointer-events-auto">
              {/* 前半30分 */}
              <div 
                className="flex-1 hover:bg-indigo-50/30 transition-colors"
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => handleDrop(e, hour, 0)}
              />
              {/* 後半30分 */}
              <div 
                className="flex-1 hover:bg-indigo-50/30 transition-colors border-l border-slate-50/30"
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                onDrop={(e) => handleDrop(e, hour, 30)}
              />
            </div>
          );
        })}
      </div>

      {/* 2. 予約カードレイヤー */}
      <div className="relative h-full w-full z-20 min-h-[120px] pointer-events-none">
        {appointments.map((app) => {
          const start = new Date(app.start_time);
          const end = new Date(app.end_time);
          
          // 9:00からの経過分数
          const startMinutes = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
          // 滞在分数
          const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
          
          // 位置と幅を計算 (%)
          const leftPos = (startMinutes / TOTAL_MINUTES) * 100;
          const widthSize = (durationMinutes / TOTAL_MINUTES) * 100;

          return (
            <div
              key={app.id}
              className="absolute top-1/2 -translate-y-1/2 h-[75%] px-1 transition-all duration-300 pointer-events-auto"
              style={{ 
                left: `${leftPos}%`, 
                width: `${widthSize}%`,
                minWidth: '120px' 
              }}
            >
              {/* カード内の余白を調整してスタイリッシュに */}
              <div className="h-full shadow-lg rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform active:scale-95">
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