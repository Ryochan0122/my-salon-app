"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, History, User } from 'lucide-react';
import { Appointment } from '@/types';

export const DailyPrepSidebar = ({ appointments }: { appointments: Appointment[] }) => {
  const [prepData, setPrepData] = useState<any[]>([]);

  useEffect(() => {
    const fetchLastNotes = async () => {
      // 予約ごとに前回のメモを取得
      const updatedData = await Promise.all(appointments.map(async (app) => {
        if (!app.customer_id) return { ...app };
        const { data: lastSale } = await supabase
          .from('sales')
          .select('memo, created_at')
          .eq('customer_id', app.customer_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        return { ...app, last_memo: lastSale?.memo, last_visit: lastSale?.created_at };
      }));
      setPrepData(updatedData.sort((a, b) => a.start_time.localeCompare(b.start_time)));
    };
    fetchLastNotes();
  }, [appointments]);

  return (
    <div className="w-80 flex-none bg-white rounded-[3rem] shadow-xl border border-slate-100 flex flex-col h-[80vh] overflow-hidden hidden xl:flex">
      <div className="p-8 border-b border-slate-50">
        <h3 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">本日のカルテ予習</h3>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Daily Preparation</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30">
        {prepData.length > 0 ? prepData.map((app) => (
          <div key={app.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-50 group">
            <div className="flex items-center justify-between mb-3">
              <div className="px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black">
                {app.start_time.slice(11, 16)}
              </div>
              <span className="text-[9px] font-bold text-slate-300 uppercase">
                {app.last_visit ? new Date(app.last_visit).toLocaleDateString() : 'ご新規様'}
              </span>
            </div>
            <h4 className="font-black text-slate-900 text-sm mb-1">{app.customer_name} 様</h4>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-50">
              <div className="flex items-center gap-1 opacity-30 mb-1">
                <History size={10} />
                <span className="text-[8px] font-black uppercase">前回のメモ</span>
              </div>
              <p className="text-[10px] font-bold text-slate-600 italic leading-relaxed">
                {app.last_memo ? `"${app.last_memo}"` : "過去のメモはありません"}
              </p>
            </div>
          </div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-200">
            <User size={32} className="opacity-10 mb-2" />
            <p className="text-[9px] font-black uppercase tracking-widest">本日の予約はありません</p>
          </div>
        )}
      </div>
    </div>
  );
};