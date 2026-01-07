"use client";
import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Check } from 'lucide-react';
import { Staff } from '@/types';
import { supabase } from '@/lib/supabase';

interface Props {
  staff: Staff[];
  onClose: () => void;
  onRefresh: () => void;
}

export const HolidaySettingsModal = ({ staff, onClose, onRefresh }: Props) => {
  const [selectedStaffId, setSelectedStaffId] = useState(staff[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSaveHoliday = async () => {
    setLoading(true);
    try {
      // staff_schedulesテーブルに公休を登録
      const { error } = await supabase
        .from('staff_schedules')
        .insert([{
          staff_id: selectedStaffId,
          date: date,
          is_holiday: true
        }]);

      if (error) throw error;
      
      alert('公休を設定しました');
      onRefresh(); // ボードを更新
      onClose();
    } catch (error) {
      alert('保存に失敗しました。既に設定されている可能性があります。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 space-y-6">
        <header className="flex justify-between items-center">
          <h3 className="text-xl font-black italic text-slate-900 uppercase">Holiday Setting</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all"><X size={20}/></button>
        </header>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">対象スタッフ</label>
            <select 
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl font-bold appearance-none"
            >
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">休みの日付</label>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full mt-2 p-4 bg-slate-50 border-none rounded-2xl font-bold"
            />
          </div>
        </div>

        <button 
          onClick={handleSaveHoliday}
          disabled={loading}
          className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black text-sm hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
        >
          {loading ? '保存中...' : <><Check size={18} /> 公休として登録</>}
        </button>
      </div>
    </div>
  );
};