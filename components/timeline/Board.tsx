"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Staff, Appointment, Sale, Service } from '@/types'; // SaleとServiceを追加
import { StaffRow } from './StaffRow';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  Wallet,      // 売上アイコン
  TrendingUp   // 見込みアイコン
} from 'lucide-react';
import { DailyPrepSidebar } from './DailyPrepSidebar';
import { supabase } from '@/lib/supabase';

interface BoardProps {
  staff: Staff[];
  appointments: Appointment[];
  sales?: Sale[];    // 売上計算用に追加
  services?: Service[]; // 価格取得用に追加
  onRefresh: () => void;
  onAdd: () => void;
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onShowChart: (name: string) => void;
  onMove: (appointmentId: string, newStaffId: string, newStartTime: string) => Promise<void>;
}

export const Board = ({ 
  staff, 
  appointments, 
  sales = [],
  services = [],
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
  const hourWidth = 200;

  // --- 売上集計ロジック (既存のUIを壊さずデータのみ追加) ---
  const dailyStats = useMemo(() => {
    const isSameDay = (d1: Date, d2: string) => 
      new Date(d1).toDateString() === new Date(d2).toDateString();

    const confirmed = sales
      .filter(s => isSameDay(selectedDate, s.created_at))
      .reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);

    const expected = appointments
      .filter(a => isSameDay(selectedDate, a.start_time))
      .filter(a => !sales.some(s => s.appointment_id === a.id))
      .reduce((sum, a) => {
        const service = services.find(s => s.name === a.menu_name);
        return sum + (service?.price || 0);
      }, 0);

    return { confirmed, total: confirmed + expected };
  }, [selectedDate, sales, appointments, services]);

  // 公休データの取得 (404エラーガード付き)
  const fetchHolidays = useCallback(async () => {
    const shopId = localStorage.getItem('aura_shop_id');
    if (!shopId) return; // shop_idがない時は通信しない

    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data } = await supabase
      .from('staff_schedules')
      .select('staff_id')
      .eq('date', dateStr)
      .eq('is_holiday', true)
      .eq('shop_id', shopId);
    
    setHolidays(data?.map(h => h.staff_id) || []);
  }, [selectedDate]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

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
        
        if (scrollContainerRef.current && nowPos === 0) {
          scrollContainerRef.current.scrollTo({
            left: position - 200,
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
      alert('予約の移動に失敗しました。');
    } finally {
      setIsRescheduling(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 items-start relative pb-20 max-w-[2000px] mx-auto transition-all animate-in fade-in duration-700 px-4">
      
      {/* 1. LEFT: Navigator */}
      <div className="w-full xl:w-[380px] flex-none bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 xl:sticky xl:top-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h4 className="font-black italic text-slate-900 text-2xl uppercase">
              {currentMonth.getFullYear()}年 {currentMonth.getMonth() + 1}月
            </h4>
          </div>
          <div className="flex gap-1">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><ChevronLeft size={20}/></button>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><ChevronRight size={20}/></button>
          </div>
        </header>
        
        <div className="grid grid-cols-7 gap-2 text-center mb-8">
          {['日','月','火','水','木','金','土'].map((day, idx) => (
            <div key={`weekday-${idx}`} className={`text-[10px] font-black mb-2 ${idx === 0 ? 'text-rose-400' : 'text-slate-300'}`}>{day}</div>
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
                className={`aspect-square flex flex-col items-center justify-center text-sm font-black rounded-2xl transition-all relative
                  ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'hover:bg-slate-50 text-slate-500'}`}
              >
                {day}
                {hasBooking && !isSelected && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-indigo-400" />}
              </button>
            );
          })}
        </div>

        {/* --- 売上パネルを追加 --- */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-900 p-4 rounded-[1.5rem] text-white">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Wallet size={10} /> 確定売上</p>
            <p className="text-lg font-black italic text-indigo-400">¥{dailyStats.confirmed.toLocaleString()}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><TrendingUp size={10} /> 本日見込</p>
            <p className="text-lg font-black italic text-slate-900">¥{dailyStats.total.toLocaleString()}</p>
          </div>
        </div>

        <button onClick={onAdd} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200">
          <Plus size={20} /> 新規予約を登録
        </button>
      </div>

      {/* 2. CENTER: MASTER TIMELINE */}
      <div className={`flex-1 w-full bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[85vh] ${isRescheduling ? 'opacity-50' : ''}`}>
        
        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic text-slate-900 tracking-tighter">
                {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
              </h3>
            </div>
          </div>
          <div className="bg-slate-50 px-5 py-2 rounded-2xl border border-slate-100">
             <span className="text-xs font-black text-slate-400">本日の予約数: <span className="text-indigo-600 text-lg ml-1">{filteredApps.length}</span></span>
          </div>
        </div>
        
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-auto custom-scrollbar relative bg-white"
        >
          <div style={{ width: `${hoursCount * hourWidth + 200}px` }} className="h-full flex flex-col">
            
            <div className="flex sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
              <div className="w-48 flex-none border-r border-slate-100 p-4 bg-slate-50/50">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">担当スタッフ</span>
              </div>
              <div className="flex flex-1">
                {Array.from({ length: hoursCount }).map((_, i) => (
                  <div key={`hour-${i}`} style={{ width: `${hourWidth}px` }} className="flex-none py-4 text-center border-r border-slate-50 last:border-none">
                    <span className="text-[11px] font-black text-slate-400">{(startHour + i).toString().padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative">
              {nowPos > 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none"
                  style={{ left: `${nowPos + 192}px` }} 
                >
                  <div className="absolute top-0 -left-1.5 w-3 h-3 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
                </div>
              )}

              {staff.map(member => {
                const isOff = holidays.includes(member.id);
                return (
                  <div key={member.id} className={`flex min-h-[160px] border-b border-slate-50 group ${isOff ? 'bg-slate-50/80' : ''}`}>
                    <div className="w-48 flex-none p-6 bg-white sticky left-0 z-20 border-r border-slate-100 flex flex-col items-center justify-center text-center">
                      <div className={`relative w-14 h-14 rounded-[1.5rem] mb-2 flex items-center justify-center font-black text-xl border border-slate-100 transition-all ${isOff ? 'bg-slate-200 text-slate-400' : 'bg-slate-50 text-slate-900 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                        {member.name.slice(0, 1)}
                        {isOff && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full">OFF</span>}
                      </div>
                      <div className={`font-black text-sm tracking-tighter truncate w-full ${isOff ? 'text-slate-400' : 'text-slate-900'}`}>{member.name}</div>
                      <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">スタイリスト</div>
                    </div>

                    <div className="flex-1 relative bg-slate-50/20">
                      {isOff && (
                        <div className="absolute inset-0 z-10 bg-slate-100/40 flex items-center justify-center pointer-events-none">
                          <div className="flex items-center gap-2 text-slate-300 font-black uppercase text-xs tracking-widest">
                            <AlertCircle size={14} /> 公休
                          </div>
                        </div>
                      )}
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
      </div>

      {/* 3. RIGHT: Sidebar */}
      <div className="w-full xl:w-96 flex-none">
        <DailyPrepSidebar appointments={filteredApps} />
      </div>
    </div>
  );
};