"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Staff, Appointment, Sale, Service } from '@/types';
import { StaffRow } from './StaffRow';
import { 
  Plus, ChevronLeft, ChevronRight, AlertCircle,
  Wallet, TrendingUp, Calendar as CalIcon, RefreshCw, Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface BoardProps {
  staff: Staff[];
  appointments: Appointment[];
  sales?: Sale[];
  services?: Service[];
  onRefresh: () => void;
  onAdd: () => void;
  onPay: (app: Appointment) => void;
  onEdit: (app: Appointment) => void;
  onDelete: (id: string) => void;
  onShowChart: (name: string) => void;
  onMove: (appointmentId: string, newStaffId: string, newStartTime: string) => Promise<void>;
  onAddAtTime: (staffId: string, date: Date, time: string) => void;
}

// スタッフカラーパレット
const STAFF_COLORS = [
  { bar: 'bg-violet-500', light: 'bg-violet-500/20', text: 'text-violet-300', border: 'border-violet-500/30', card: 'from-violet-900/40' },
  { bar: 'bg-sky-500', light: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/30', card: 'from-sky-900/40' },
  { bar: 'bg-emerald-500', light: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30', card: 'from-emerald-900/40' },
  { bar: 'bg-rose-500', light: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/30', card: 'from-rose-900/40' },
  { bar: 'bg-amber-500', light: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30', card: 'from-amber-900/40' },
  { bar: 'bg-indigo-500', light: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/30', card: 'from-indigo-900/40' },
];

export const Board = ({ 
  staff, appointments, sales = [], services = [],
  onRefresh, onAdd, onPay, onEdit, onDelete, onShowChart, onMove, onAddAtTime
}: BoardProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [holidays, setHolidays] = useState<string[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [nowPos, setNowPos] = useState(0);

  const startHour = 9;
  const hoursCount = 13;
  const hourWidth = 180;

  // スタッフ→カラーのマッピング
  const staffColorMap = useMemo(() => {
    const map: Record<string, typeof STAFF_COLORS[0]> = {};
    staff.forEach((s, i) => {
      map[s.id] = STAFF_COLORS[i % STAFF_COLORS.length];
    });
    return map;
  }, [staff]);

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

  const fetchHolidays = useCallback(async () => {
    const shopId = localStorage.getItem('aura_shop_id');
    if (!shopId) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { data } = await supabase
      .from('staff_schedules').select('staff_id')
      .eq('date', dateStr).eq('is_holiday', true).eq('shop_id', shopId);
    setHolidays(data?.map(h => h.staff_id) || []);
  }, [selectedDate]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  useEffect(() => {
    const updateNowPosition = () => {
      const now = new Date();
      if (now.toDateString() !== selectedDate.toDateString()) { setNowPos(-1); return; }
      const hours = now.getHours();
      const minutes = now.getMinutes();
      if (hours >= startHour && hours < startHour + hoursCount) {
        setNowPos(((hours - startHour) * hourWidth) + (minutes / 60 * hourWidth));
      }
    };
    updateNowPosition();
    const timer = setInterval(updateNowPosition, 60000);
    return () => clearInterval(timer);
  }, [selectedDate]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    return [...Array(firstDay).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  };

  const filteredApps = useMemo(() => {
    return appointments.filter(app => {
      const appDate = new Date(app.start_time);
      return (
        appDate.getFullYear() === selectedDate.getFullYear() &&
        appDate.getMonth() === selectedDate.getMonth() &&
        appDate.getDate() === selectedDate.getDate()
      );
    });
  }, [appointments, selectedDate]);

  const handleMoveAppointment = async (appId: string, newStartTime: string, newStaffId: string) => {
    if (holidays.includes(newStaffId)) { alert("選択されたスタッフはこの日公休です。"); return; }
    setIsRescheduling(true);
    try {
      await onMove(appId, newStaffId, newStartTime);
      onRefresh();
    } catch { alert('予約の移動に失敗しました。'); }
    finally { setIsRescheduling(false); }
  };

  const todayStr = new Date().toDateString();
  const isToday = selectedDate.toDateString() === todayStr;

  return (
    <div className="flex gap-6 items-start relative pb-20 max-w-[2000px] mx-auto animate-in fade-in duration-700">
      
      {/* LEFT: カレンダー＋stats */}
      <div className="w-[320px] flex-none flex flex-col gap-4 xl:sticky xl:top-8 z-50">
        
        {/* カレンダー */}
        <div className="bg-slate-900 rounded-[2.5rem] p-6 border border-white/5 shadow-2xl">
          <header className="flex justify-between items-center mb-6">
            <h4 className="font-black italic text-white text-lg uppercase tracking-tight">
              {currentMonth.getFullYear()} <span className="text-violet-400">/</span> {String(currentMonth.getMonth() + 1).padStart(2, '0')}
            </h4>
            <div className="flex gap-1">
              <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"><ChevronLeft size={18}/></button>
              <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-white/40 hover:text-white"><ChevronRight size={18}/></button>
            </div>
          </header>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['S','M','T','W','T','F','S'].map((day, idx) => (
              <div key={idx} className={`text-[9px] font-black mb-1 tracking-widest ${idx === 0 ? 'text-rose-400' : 'text-white/20'}`}>{day}</div>
            ))}
            {getDaysInMonth().map((day, i) => {
              if (!day) return <div key={`blank-${i}`} />;
              const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isSelected = dateObj.toDateString() === selectedDate.toDateString();
              const isT = dateObj.toDateString() === todayStr;
              const hasBooking = appointments.some(a => new Date(a.start_time).toDateString() === dateObj.toDateString());
              return (
                <button 
                  key={`day-${dateObj.getTime()}`} 
                  onClick={() => setSelectedDate(dateObj)}
                  className={`aspect-square flex flex-col items-center justify-center text-xs font-black rounded-xl transition-all relative
                    ${isSelected ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : isT ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/40'}`}
                >
                  {day}
                  {hasBooking && !isSelected && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-violet-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-slate-900 rounded-[2.5rem] p-6 border border-white/5 shadow-2xl space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`} />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
              {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })}
            </span>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Confirmed</p>
            <p className="text-2xl font-black italic text-violet-400">¥{dailyStats.confirmed.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Expected Total</p>
            <p className="text-2xl font-black italic text-white">¥{dailyStats.total.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Bookings</p>
            <p className="text-2xl font-black italic text-white">{filteredApps.length}</p>
          </div>
        </div>

        {/* スタッフ凡例 */}
        <div className="bg-slate-900 rounded-[2.5rem] p-6 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="text-white/30" />
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Staff</span>
          </div>
          <div className="space-y-2">
            {staff.map((member) => {
              const color = staffColorMap[member.id];
              const isOff = holidays.includes(member.id);
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isOff ? 'bg-white/10' : color.bar}`} />
                  <span className={`text-xs font-black ${isOff ? 'text-white/20 line-through' : 'text-white/60'}`}>{member.name}</span>
                  {isOff && <span className="text-[8px] font-black text-rose-400 uppercase">OFF</span>}
                </div>
              );
            })}
          </div>
        </div>

        <button 
          onClick={onAdd} 
          className="w-full py-5 bg-violet-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-violet-500 transition-all shadow-xl shadow-violet-500/20 active:scale-95"
        >
          <Plus size={20} /> NEW APPOINTMENT
        </button>
      </div>

      {/* CENTER: タイムライン */}
      <div className={`flex-1 bg-slate-900 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col h-[90vh] ${isRescheduling ? 'cursor-wait' : ''}`}>
        
        {/* ヘッダー */}
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-violet-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <CalIcon size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-violet-400 uppercase tracking-[0.3em]">Timeline</p>
              <h3 className="text-2xl font-black italic text-white tracking-tighter uppercase">
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                {isToday && <span className="ml-3 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 not-italic">TODAY</span>}
              </h3>
            </div>
          </div>
          <button onClick={onRefresh} className="p-3 bg-white/5 text-white/30 rounded-xl hover:text-white hover:bg-white/10 transition-all">
            <RefreshCw size={18} />
          </button>
        </div>
        
        {/* スクロールエリア */}
        <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">
          <div style={{ width: `${hoursCount * hourWidth + 160}px` }} className="h-full flex flex-col">
            
            {/* 時間軸ヘッダー */}
            <div className="flex sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-white/5">
              <div className="w-40 flex-none border-r border-white/5 p-4">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Stylist</span>
              </div>
              <div className="flex flex-1">
                {Array.from({ length: hoursCount }).map((_, i) => (
                  <div key={i} style={{ width: `${hourWidth}px` }} className="flex-none py-4 text-center border-r border-white/5 last:border-none">
                    <span className="text-[10px] font-black text-white/30 tracking-widest">{(startHour + i).toString().padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 relative">
              {/* 現在時刻バー */}
              {nowPos > 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-rose-500/80 z-30 pointer-events-none"
                  style={{ left: `${nowPos + 160}px` }}
                >
                  <div className="absolute top-2 -left-1 w-2 h-2 bg-rose-500 rounded-full shadow-lg shadow-rose-500/50" />
                </div>
              )}

              {/* 30分グリッド線 */}
              <div className="absolute inset-0 flex pointer-events-none">
                <div className="w-40 flex-none" />
                {Array.from({ length: hoursCount }).map((_, i) => (
                  <div key={i} style={{ width: `${hourWidth}px` }} className="flex-none flex border-r border-white/5">
                    <div className="flex-1 border-r border-white/[0.03]" />
                    <div className="flex-1" />
                  </div>
                ))}
              </div>

              {staff.map((member) => {
                const isOff = holidays.includes(member.id);
                const color = staffColorMap[member.id];
                return (
                  <div key={member.id} className={`flex border-b border-white/5 min-h-[130px] group relative`}>
                    {/* スタッフ名エリア */}
                    <div className={`w-40 flex-none p-4 sticky left-0 z-20 border-r border-white/5 flex flex-col items-center justify-center text-center bg-slate-900`}>
                      <div className={`relative w-12 h-12 rounded-2xl mb-2 flex items-center justify-center font-black text-lg transition-all
                        ${isOff ? 'bg-white/5 text-white/20' : `${color.light} border ${color.border}`}`}>
                        <span className={isOff ? 'text-white/20' : color.text}>{member.name.slice(0, 1)}</span>
                        {isOff && <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[7px] px-1 py-0.5 rounded-full font-black">OFF</span>}
                      </div>
                      <div className={`font-black text-[11px] tracking-tight ${isOff ? 'text-white/20' : 'text-white/60'}`}>{member.name}</div>
                      <div className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${isOff ? 'text-white/10' : color.text}`}>{member.role || 'Stylist'}</div>
                    </div>

                    <div className="flex-1 relative">
                      {isOff && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                          <p className="text-white/10 font-black uppercase text-[9px] tracking-[0.5em] flex items-center gap-2">
                            <AlertCircle size={12} /> Holiday
                          </p>
                        </div>
                      )}
                      <StaffRow 
                        member={member} 
                        appointments={filteredApps.filter(a => a.staff_id === member.id)}
                        selectedDate={selectedDate}
                        onPay={onPay}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onMoveApp={(appId, startTime) => handleMoveAppointment(appId, startTime, member.id)}
                        onShowChart={onShowChart}
                        onAddAtTime={onAddAtTime}
                        staffColor={color}
                        viewMode="horizontal"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};