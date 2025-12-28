"use client";
import React, { useState } from 'react';
import { Staff, Appointment } from '@/types';
import { StaffRow } from './StaffRow';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, MousePointer2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BoardProps {
  staff: Staff[];
  appointments: Appointment[];
  onRefresh: () => void; // 予約更新後にデータを再取得するための関数
  onAdd: () => void;
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
}

export const Board = ({ staff, appointments, onRefresh, onAdd, onPay, onEdit, onDelete }: BoardProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRescheduling, setIsRescheduling] = useState(false);

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(nextMonth);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: firstDay }, (_, i) => null);
    const dateArray = Array.from({ length: days }, (_, i) => i + 1);
    return [...blanks, ...dateArray];
  };

  const filteredApps = appointments.filter(app => {
    const appDate = new Date(app.start_time);
    return (
      appDate.getFullYear() === selectedDate.getFullYear() &&
      appDate.getMonth() === selectedDate.getMonth() &&
      appDate.getDate() === selectedDate.getDate()
    );
  });

  // 【100機能：ドラッグ＆ドロップによる予約時間変更ロジック】
  // StaffRow側で発生したドロップイベントを受け取り、DBを更新します
  const handleMoveAppointment = async (appId: string, newStartTime: string) => {
    setIsRescheduling(true);
    try {
      const { data: currentApp } = await supabase.from('appointments').select('*').eq('id', appId).single();
      if (!currentApp) return;

      // 元の所要時間（duration）を計算
      const duration = new Date(currentApp.end_time).getTime() - new Date(currentApp.start_time).getTime();
      const newStart = new Date(newStartTime);
      const newEnd = new Date(newStart.getTime() + duration);

      const { error } = await supabase
        .from('appointments')
        .update({
          start_time: newStart.toISOString(),
          end_time: newEnd.toISOString()
        })
        .eq('id', appId);

      if (error) throw error;
      onRefresh(); // app/page.tsx 等で定義したデータ取得関数を叩く
    } catch (error) {
      console.error('Failed to reschedule:', error);
      alert('予約の移動に失敗しました。');
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start relative pb-20">
      
      {/* LEFT: Mini Navigator */}
      <div className="w-full lg:w-80 flex-none bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 lg:sticky lg:top-8 transition-all">
        <div className="flex justify-between items-center mb-6 px-2">
          <h4 className="font-black italic text-slate-900 tracking-tighter text-lg">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h4>
          <div className="flex gap-1">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><ChevronLeft size={16}/></button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"><ChevronRight size={16}/></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center mb-4">
          {['S','M','T','W','T','F','S'].map((day, idx) => (
            <div key={`weekday-${day}-${idx}`} className="text-[10px] font-black text-slate-200 uppercase mb-2">{day}</div>
          ))}
          {getDaysInMonth().map((day, i) => {
            if (!day) return <div key={`blank-${i}`} />;
            const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isToday = dateObj.toDateString() === new Date().toDateString();
            const isSelected = dateObj.toDateString() === selectedDate.toDateString();
            const hasBooking = appointments.some(a => new Date(a.start_time).toDateString() === dateObj.toDateString());

            return (
              <button 
                key={`day-${day}`} 
                onClick={() => setSelectedDate(dateObj)}
                className={`aspect-square flex items-center justify-center text-sm font-bold rounded-xl transition-all relative
                  ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 z-10' : 'hover:bg-slate-50 text-slate-600'}
                  ${isToday && !isSelected ? 'text-indigo-600 border border-indigo-100' : ''}`}
              >
                {day}
                {hasBooking && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-indigo-300 rounded-full" />}
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50 space-y-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <MousePointer2 size={12} className="text-indigo-500" /> Drag items to move
          </div>
           <button 
            onClick={onAdd}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
          >
            <Plus size={20} /> 新規予約
          </button>
        </div>
      </div>

      {/* RIGHT: Daily Timeline */}
      <div className={`flex-1 w-full bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col h-[80vh] transition-opacity ${isRescheduling ? 'opacity-50' : 'opacity-100'}`}>
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic text-slate-900 leading-none">
                {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
              </h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Daily Timeline</p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest border border-slate-100 px-3 py-1 rounded-full">
              {filteredApps.length} Bookings
            </span>
          </div>
        </div>
        
        <div className="overflow-auto flex-1 divide-y divide-slate-50 custom-scrollbar relative">
          {staff.length > 0 ? (
            staff.map(member => (
              <StaffRow 
                key={member.id} 
                member={member} 
                appointments={filteredApps.filter(a => a.staff_id === member.id)}
                onPay={onPay}
                onEdit={onEdit}
                onDelete={onDelete}
                // 下記を追加：StaffRow側で移動が起きた際にBoardの関数を呼ぶ
                onMoveApp={handleMoveAppointment} 
              />
            ))
          ) : (
            <div className="p-20 text-center text-slate-300 font-black italic text-xl">No Staff Assigned</div>
          )}
        </div>
      </div>
    </div>
  );
};