"use client";
import React, { useState } from 'react';
import { Staff, Appointment } from '@/types';
import { StaffRow } from './StaffRow';
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, MousePointer2, Zap, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DailyPrepSidebar } from './DailyPrepSidebar';

interface BoardProps {
  staff: Staff[];
  appointments: Appointment[];
  onRefresh: () => void;
  onAdd: () => void;
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onShowChart: (name: string) => void;
}

export const Board = ({ 
  staff, 
  appointments, 
  onRefresh, 
  onAdd, 
  onPay, 
  onEdit, 
  onDelete, 
  onShowChart 
}: BoardProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRescheduling, setIsRescheduling] = useState(false);

  // 営業時間の設定 (9:00 - 21:00)
  const startHour = 9;
  const hoursCount = 13; // 9時から21時まで

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

  const handleMoveAppointment = async (appId: string, newStartTime: string) => {
    setIsRescheduling(true);
    try {
      const { data: currentApp } = await supabase.from('appointments').select('*').eq('id', appId).single();
      if (!currentApp) return;

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
      onRefresh();
    } catch (error) {
      console.error('Failed to reschedule:', error);
      alert('予約の移動に失敗しました。');
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start relative pb-20 max-w-[2000px] mx-auto transition-all animate-in fade-in duration-700 px-4">
      
      {/* 1. LEFT: Premium Navigator */}
      <div className="w-full xl:w-[400px] flex-none bg-white rounded-[3.5rem] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border border-slate-100 xl:sticky xl:top-8 overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
        
        <header className="flex justify-between items-center mb-10 relative">
          <div>
            <h4 className="font-black italic text-slate-900 tracking-tighter text-3xl uppercase leading-none">
              {currentMonth.toLocaleDateString('ja-JP', { month: 'long' })}
            </h4>
            <span className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mt-1 block">
              {currentMonth.getFullYear()} Schedule
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-900 hover:text-white rounded-2xl text-slate-400 transition-all border border-slate-100 shadow-sm"><ChevronLeft size={20}/></button>
            <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-900 hover:text-white rounded-2xl text-slate-400 transition-all border border-slate-100 shadow-sm"><ChevronRight size={20}/></button>
          </div>
        </header>
        
        <div className="grid grid-cols-7 gap-3 text-center mb-8 relative">
          {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((day, idx) => (
            <div key={`weekday-${day}-${idx}`} className={`text-[9px] font-black uppercase mb-4 tracking-widest ${idx === 0 ? 'text-rose-400' : 'text-slate-300'}`}>{day}</div>
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
                className={`w-full aspect-square flex flex-col items-center justify-center text-xl font-black rounded-[1.5rem] transition-all relative group/date
                  ${isSelected 
                    ? 'bg-slate-900 text-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] scale-110 z-10' 
                    : 'hover:bg-indigo-50 text-slate-500'}
                  ${isToday && !isSelected ? 'text-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30' : ''}`}
              >
                <span className="relative z-10">{day}</span>
                {hasBooking && (
                  <span className={`absolute bottom-3 w-1.5 h-1.5 rounded-full transition-all ${isSelected ? 'bg-indigo-400' : 'bg-indigo-500'}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="space-y-4 relative">
          <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-[1.5rem] text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100">
            <Zap size={14} className="text-amber-400 fill-amber-400" /> Smart Management Active
          </div>
           <button 
            onClick={onAdd}
            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-900 hover:translate-y-[-4px] transition-all shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)]"
          >
            <Plus size={24} /> NEW BOOKING
          </button>
        </div>
      </div>

      {/* 2. CENTER: Master Horizontal Timeline */}
      <div className={`flex-1 w-full bg-white rounded-[4rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] border border-slate-100 overflow-hidden flex flex-col h-[85vh] transition-all ${isRescheduling ? 'opacity-50 grayscale' : 'opacity-100'}`}>
        
        {/* Timeline Header */}
        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl rotate-3">
              <Clock size={28} />
            </div>
            <div>
              <h3 className="text-3xl font-black italic text-slate-900 leading-none tracking-tighter">
                {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
              </h3>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Horizontal Master View</p>
            </div>
          </div>
          <div className="hidden md:flex gap-4">
             <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 text-right min-w-[120px]">
                <span className="text-3xl font-black text-slate-900 italic tracking-tighter leading-none block">{filteredApps.length}</span>
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">Bookings</span>
             </div>
          </div>
        </div>
        
        {/* Scrollable Timeline Area */}
        <div className="flex-1 overflow-auto custom-scrollbar relative bg-slate-50/20">
          <div className="min-w-[1400px] h-full flex flex-col">
            
            {/* Time Scale (9:00 - 21:00) */}
            <div className="flex border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-30">
              <div className="w-48 flex-none bg-slate-50/50 border-r border-slate-100 p-4 flex items-end">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Personnel</span>
              </div>
              <div className="flex-1 flex">
                {Array.from({ length: hoursCount }).map((_, i) => (
                  <div key={i} className="flex-1 min-w-[100px] py-6 text-center border-r border-slate-50 last:border-none group">
                    <span className="text-xs font-black text-slate-400 group-hover:text-indigo-600 transition-colors">{(startHour + i).toString().padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Slots */}
            <div className="flex-1">
              {staff.length > 0 ? (
                staff.map(member => (
                  <div key={member.id} className="flex min-h-[140px] border-b border-slate-50 group hover:bg-slate-50/30 transition-all">
                    {/* Staff Info Column (Left Fixed) */}
                    <div className="w-48 flex-none p-6 bg-white sticky left-0 z-20 border-r border-slate-100 flex flex-col justify-center shadow-[10px_0_20px_-10px_rgba(0,0,0,0.03)]">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl mb-3 flex items-center justify-center font-black text-lg shadow-sm border border-indigo-100">
                        {member.name.slice(0, 1)}
                      </div>
                      <div className="font-black text-slate-900 text-base tracking-tighter truncate">{member.name}</div>
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Specialist</div>
                    </div>

                    {/* Timeline Content (Right Scrollable) */}
                    <div className="flex-1 relative">
                      {/* Grid Guide Lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {Array.from({ length: hoursCount }).map((_, i) => (
                          <div key={i} className="flex-1 border-r border-slate-50/50" />
                        ))}
                      </div>

                      {/* Appointment Blocks */}
                      <div className="relative h-full w-full p-4">
                        <StaffRow 
                          member={member} 
                          appointments={filteredApps.filter(a => a.staff_id === member.id)}
                          selectedDate={selectedDate}
                          onPay={onPay}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onMoveApp={handleMoveAppointment} 
                          onShowChart={onShowChart}
                          // horizontalモードのフラグを渡す（StaffRowでスタイルを切り替えるため）
                          viewMode="horizontal" 
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-40 text-slate-200">
                  <MousePointer2 size={60} className="mb-4 opacity-5" />
                  <p className="font-black italic text-2xl uppercase tracking-tighter opacity-20">Waiting for assignment</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. RIGHT: Side Insight */}
      <div className="w-full xl:w-96 flex-none sticky top-8">
        <DailyPrepSidebar appointments={filteredApps} />
      </div>

    </div>
  );
};