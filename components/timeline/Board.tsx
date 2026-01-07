"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Staff, Appointment } from '@/types';
import { StaffRow } from './StaffRow';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertCircle, 
  Calendar as CalendarIcon,
  LayoutGrid,
  Search
} from 'lucide-react';
import { DailyPrepSidebar } from './DailyPrepSidebar';
import { supabase } from '@/lib/supabase';

interface BoardProps {
  staff: Staff[];
  appointments: Appointment[];
  onRefresh: () => void;
  onAdd: () => void;
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onShowChart: (name: string, id?: string) => void;
  onMove: (appointmentId: string, newStaffId: string, newStartTime: string) => Promise<void>;
}

export const Board = ({ 
  staff, 
  appointments, 
  onRefresh, 
  onAdd, 
  onPay, 
  onEdit, 
  onDelete, 
  onShowChart,
  onMove
}: BoardProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [holidays, setHolidays] = useState<string[]>([]);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [nowPos, setNowPos] = useState(0);

  const startHour = 9;
  const hoursCount = 13;
  const hourWidth = 220; // 少し広げて視認性をアップ

  // 公休データの取得
  const fetchHolidays = useCallback(async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data } = await supabase
      .from('staff_schedules')
      .select('staff_id')
      .eq('date', dateStr)
      .eq('is_holiday', true);
    
    setHolidays(data?.map(h => h.staff_id) || []);
  }, [selectedDate]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // 現在時刻のインジケーター更新
  useEffect(() => {
    const updateNowPosition = () => {
      const now = new Date();
      if (now.toDateString() !== selectedDate.toDateString()) {
        setNowPos(-1);
        return;
      }
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      if (hours >= startHour && hours < startHour + hoursCount) {
        const position = ((hours - startHour) * hourWidth) + (minutes / 60 * hourWidth);
        setNowPos(position);
        
        // 初回のみ現在時刻までスクロール
        if (scrollContainerRef.current && nowPos === 0) {
          scrollContainerRef.current.scrollTo({
            left: position - 100,
            behavior: 'smooth'
          });
        }
      }
    };

    updateNowPosition();
    const timer = setInterval(updateNowPosition, 60000);
    return () => clearInterval(timer);
  }, [selectedDate, nowPos]);

  const changeMonth = (offset: number) => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(nextMonth);
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  };

  const filteredApps = appointments.filter(app => {
    const appDate = new Date(app.start_time);
    return (
      appDate.getFullYear() === selectedDate.getFullYear() &&
      appDate.getMonth() === selectedDate.getMonth() &&
      appDate.getDate() === selectedDate.getDate()
    );
  });

  const handleMoveAppointment = async (appId: string, newStartTime: string, newStaffId: string) => {
    if (holidays.includes(newStaffId)) {
      alert("選択されたスタッフはこの日公休です。");
      return;
    }

    const hasConflict = filteredApps.some(app => {
      if (app.id === appId || app.staff_id !== newStaffId) return false;
      const newStart = new Date(newStartTime).getTime();
      const existingStart = new Date(app.start_time).getTime();
      const existingEnd = new Date(app.end_time).getTime();
      return (newStart >= existingStart && newStart < existingEnd);
    });

    if (hasConflict && !window.confirm("予約が重複しています。移動しますか？")) {
      return;
    }

    setIsRescheduling(true);
    try {
      await onMove(appId, newStaffId, newStartTime);
    } catch (error) {
      console.error(error);
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-10 items-start relative pb-20 max-w-[2400px] mx-auto transition-all animate-in fade-in duration-1000 px-6">
      
      {/* 1. LEFT: Intelligent Navigator */}
      <div className="w-full xl:w-[420px] flex-none space-y-8 xl:sticky xl:top-10">
        <div className="bg-white rounded-[4rem] p-10 shadow-xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <CalendarIcon size={120} />
          </div>
          
          <header className="flex justify-between items-center mb-10 relative z-10">
            <h4 className="font-black italic text-slate-900 text-3xl tracking-tighter uppercase">
              {currentMonth.getFullYear()}<span className="text-indigo-600">.</span>{currentMonth.getMonth() + 1}
            </h4>
            <div className="flex gap-2">
              <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-slate-900 hover:text-white rounded-2xl transition-all shadow-sm"><ChevronLeft size={20}/></button>
              <button onClick={() => changeMonth(1)} className="p-3 hover:bg-slate-900 hover:text-white rounded-2xl transition-all shadow-sm"><ChevronRight size={20}/></button>
            </div>
          </header>
          
          <div className="grid grid-cols-7 gap-3 text-center mb-10 relative z-10">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, idx) => (
              <div key={`weekday-${idx}`} className={`text-[10px] font-black uppercase tracking-widest mb-2 ${idx === 0 ? 'text-rose-400' : 'text-slate-300'}`}>{day}</div>
            ))}
            {getDaysInMonth().map((day, i) => {
              if (!day) return <div key={`blank-${i}`} />;
              const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isSelected = dateObj.toDateString() === selectedDate.toDateString();
              const hasBooking = appointments.some(a => new Date(a.start_time).toDateString() === dateObj.toDateString());

              return (
                <button 
                  key={`day-${dateObj.getTime()}`} 
                  onClick={() => setSelectedDate(dateObj)}
                  className={`aspect-square flex flex-col items-center justify-center text-sm font-black rounded-2xl transition-all relative group
                    ${isSelected ? 'bg-slate-900 text-white shadow-2xl scale-110 z-10' : 'hover:bg-indigo-50 text-slate-500 hover:text-indigo-600'}`}
                >
                  {day}
                  {hasBooking && !isSelected && (
                    <span className="absolute bottom-2 w-1 h-1 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
                  )}
                </button>
              );
            })}
          </div>

          <button 
            onClick={onAdd} 
            className="w-full py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-2xl shadow-indigo-100 active:scale-95 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 
            Create Appointment
          </button>
        </div>

        {/* クイック検索やフィルターをここに追加可能 */}
      </div>

      {/* 2. CENTER: Master Timeline Board */}
      <div className={`flex-1 w-full bg-white rounded-[5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[88vh] relative ${isRescheduling ? 'cursor-wait' : ''}`}>
        
        {/* ボードヘッダー */}
        <div className="px-12 py-10 border-b border-slate-50 flex justify-between items-center bg-white shrink-0 relative z-50">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center shadow-2xl relative overflow-hidden group">
              <Clock size={28} className="relative z-10 group-hover:rotate-12 transition-transform" />
              <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">Timeline View</p>
              <h3 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase">
                {selectedDate.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 px-8 py-4 rounded-[2rem] border border-slate-100 flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Traffic</span>
               <span className="h-2 w-10 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${Math.min(filteredApps.length * 10, 100)}%` }} />
               </span>
               <span className="text-xl font-black italic text-slate-900">{filteredApps.length}</span>
            </div>
          </div>
        </div>
        
        {/* タイムライングリッド */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto custom-scrollbar relative bg-white"
        >
          <div style={{ width: `${hoursCount * hourWidth + 240}px` }} className="h-full flex flex-col">
            
            {/* 時間軸ラベル */}
            <div className="flex sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-100">
              <div className="w-60 flex-none border-r border-slate-100 p-6 bg-slate-50/30">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                  <LayoutGrid size={12} /> Stylists
                </span>
              </div>
              <div className="flex flex-1">
                {Array.from({ length: hoursCount }).map((_, i) => (
                  <div key={`hour-${i}`} style={{ width: `${hourWidth}px` }} className="flex-none py-6 text-center border-r border-slate-50 last:border-none">
                    <span className="text-[12px] font-black text-slate-900 italic">{(startHour + i).toString().padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>
            </div>

            {/* スタッフ行エリア */}
            <div className="flex-1 relative">
              {/* 現在時刻線 */}
              {nowPos > 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-[3px] bg-rose-500 z-50 pointer-events-none"
                  style={{ left: `${nowPos + 240}px` }} 
                >
                  <div className="absolute top-0 -left-1.5 w-4 h-4 bg-rose-500 rounded-full border-4 border-white shadow-xl shadow-rose-200" />
                  <div className="absolute top-4 left-3 px-2 py-1 bg-rose-500 text-white text-[8px] font-black rounded uppercase tracking-widest">Now</div>
                </div>
              )}

              {staff.map(member => {
                const isOff = holidays.includes(member.id);
                return (
                  <div key={member.id} className={`flex min-h-[180px] border-b border-slate-50 group relative transition-colors ${isOff ? 'bg-slate-50/50' : 'hover:bg-indigo-50/5'}`}>
                    {/* スタッフ情報固定カラム */}
                    <div className="w-60 flex-none p-8 bg-white sticky left-0 z-40 border-r border-slate-100 flex flex-col items-center justify-center text-center shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)]">
                      <div className={`relative w-20 h-20 rounded-[2.5rem] mb-4 flex items-center justify-center font-black text-2xl border-4 transition-all duration-500 ${isOff ? 'bg-slate-100 text-slate-300 border-transparent scale-90' : 'bg-white text-slate-900 border-slate-50 shadow-xl group-hover:border-indigo-100 group-hover:bg-slate-900 group-hover:text-white group-hover:scale-105'}`}>
                        {member.name.slice(0, 1)}
                        {isOff && (
                          <div className="absolute inset-0 flex items-center justify-center rotate-12">
                            <div className="px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded uppercase tracking-tighter">Day Off</div>
                          </div>
                        )}
                      </div>
                      <div className={`font-black text-base tracking-tighter truncate w-full ${isOff ? 'text-slate-300' : 'text-slate-900'}`}>{member.name}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Stylist</div>
                    </div>

                    {/* タイムラインセルエリア */}
                    <div className="flex-1 relative">
                      {isOff && (
                        <div className="absolute inset-0 z-10 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-[0.03] pointer-events-none" />
                      )}
                      
                      {/* 背景グリッド */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {Array.from({ length: hoursCount }).map((_, i) => (
                          <div key={`grid-${i}`} style={{ width: `${hourWidth}px` }} className="flex-none border-r border-slate-100/30" />
                        ))}
                      </div>

                      <div className="relative h-full w-full">
                        <StaffRow 
                          member={member} 
                          appointments={filteredApps.filter(a => a.staff_id === member.id)}
                          selectedDate={selectedDate}
                          onPay={onPay}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onMoveApp={(appId, startTime) => handleMoveAppointment(appId, startTime, member.id)} 
                          onShowChart={onShowChart}
                          viewMode="horizontal" 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 移動中のローディングオーバーレイ */}
        {isRescheduling && (
          <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Updating Schedule...</p>
            </div>
          </div>
        )}
      </div>

      {/* 3. RIGHT: Predictive Insights Sidebar */}
      <div className="w-full xl:w-[420px] flex-none">
        <DailyPrepSidebar appointments={filteredApps} />
      </div>
    </div>
  );
};