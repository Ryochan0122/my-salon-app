"use client";
import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Check, Trash2, AlertCircle } from 'lucide-react';
import { Staff } from '@/types';
import { supabase, getCurrentShopId } from '@/lib/supabase';

interface Props {
  staff: Staff[];
  onClose: () => void;
  onRefresh: () => void;
}

export const HolidaySettingsModal = ({ staff, onClose, onRefresh }: Props) => {
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleToggleHoliday = async (mode: 'save' | 'delete') => {
    setLoading(true);
    try {
      const shopId = await getCurrentShopId();
      if (!shopId) throw new Error("Shop ID not found");

      if (mode === 'save') {
        // UPSERT (あれば更新、なければ挿入) で重複エラーを回避
        const { error } = await supabase
          .from('staff_schedules')
          .upsert([{
            shop_id: shopId,
            staff_id: selectedStaffId,
            date: date,
            is_holiday: true
          }], { onConflict: 'staff_id, date' });

        if (error) throw error;
      } else {
        // 公休の削除
        const { error } = await supabase
          .from('staff_schedules')
          .delete()
          .eq('staff_id', selectedStaffId)
          .eq('date', date);

        if (error) throw error;
      }

      onRefresh();
      onClose();
    } catch (error: any) {
      alert(error.message || '操作に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
      {/* ガラスモフィズム背景 */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* 装飾的なヘッダー */}
        <div className="bg-slate-50 p-10 pb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Shift Management</span>
              </div>
              <h3 className="text-3xl font-black italic text-slate-900 uppercase tracking-tighter">
                Holiday <span className="text-rose-500">.</span>
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 bg-white hover:bg-slate-100 rounded-2xl transition-all shadow-sm group"
            >
              <X size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        <div className="p-10 pt-4 space-y-8">
          {/* スタッフ選択 */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Assign Stylist</label>
            <div className="relative">
              <select 
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full pl-6 pr-12 py-5 bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-3xl font-bold text-slate-700 appearance-none cursor-pointer transition-all outline-none"
              >
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Check size={18} />
              </div>
            </div>
          </div>

          {/* 日付選択 */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Date</label>
            <div className="relative group">
              <CalendarIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors" size={20} />
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border-2 border-transparent focus:border-rose-100 focus:bg-white rounded-3xl font-bold text-slate-700 cursor-pointer transition-all outline-none"
              />
            </div>
          </div>

          {/* アクションエリア */}
          <div className="pt-4 space-y-3">
            <button 
              onClick={() => handleToggleHoliday('save')}
              disabled={loading}
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] hover:bg-rose-600 transition-all shadow-xl shadow-rose-100 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Processing...' : <><Check size={20} /> Set as Holiday</>}
            </button>

            <button 
              onClick={() => handleToggleHoliday('delete')}
              disabled={loading}
              className="w-full py-4 text-slate-400 hover:text-rose-500 font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Trash2 size={14} /> Remove Holiday
            </button>
          </div>

          {/* 注意書き */}
          <div className="flex items-start gap-3 p-6 bg-rose-50/50 rounded-3xl border border-rose-100/50">
            <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-bold text-rose-600/70 leading-relaxed">
              公休に設定すると、そのスタッフのタイムラインはグレーアウトされ、新規予約の登録が制限されます。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};