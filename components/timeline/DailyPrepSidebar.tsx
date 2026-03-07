"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, History, User, TrendingUp, Sparkles, ChevronRight } from 'lucide-react';
import { Appointment } from '@/types';

export const DailyPrepSidebar = ({ appointments }: { appointments: Appointment[] }) => {
  const [prepData, setPrepData] = useState<any[]>([]);
  const [totalForecast, setTotalForecast] = useState(0);

  useEffect(() => {
    const fetchLastNotes = async () => {
      // 1. 予約ごとに前回のメモと「見込み売上」の元となるサービス情報を取得
      const updatedData = await Promise.all(appointments.map(async (app) => {
        if (!app.customer_id) return { ...app, price: 0 };

        // 前回の来店履歴を取得
        const { data: lastSale } = await supabase
          .from('sales')
          .select('memo, created_at')
          .eq('customer_id', app.customer_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // サービス名から価格を取得（本日の予測売上用）
        const { data: service } = await supabase
          .from('services')
          .select('price')
          .eq('name', app.menu_name)
          .single();

        return { 
          ...app, 
          last_memo: lastSale?.memo, 
          last_visit: lastSale?.created_at,
          price: service?.price || 0 
        };
      }));

      // 開始時間順にソート
      const sorted = updatedData.sort((a, b) => a.start_time.localeCompare(b.start_time));
      setPrepData(sorted);

      // 合計予測売上の計算
      const total = updatedData.reduce((sum, item) => sum + (item.price || 0), 0);
      setTotalForecast(total);
    };

    if (appointments.length > 0) {
      fetchLastNotes();
    } else {
      setPrepData([]);
      setTotalForecast(0);
    }
  }, [appointments]);

  return (
    <div className="w-80 flex-none bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col h-[85vh] overflow-hidden hidden xl:flex animate-in fade-in slide-in-from-right-10 duration-700">
      
      {/* 予測売上ヘッダー */}
      <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-60">
            <TrendingUp size={12} className="text-indigo-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Estimated Revenue</p>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black italic tracking-tighter">
              ¥{totalForecast.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold opacity-40 uppercase">Forecast</span>
          </div>
        </div>
      </div>

      {/* サブタイトル */}
      <div className="px-8 pt-8 pb-4 border-b border-slate-50 bg-white">
        <h3 className="text-lg font-black italic tracking-tighter text-slate-900 uppercase flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-500" />
          本日のカルテ予習
        </h3>
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Daily Briefing & History</p>
      </div>

      {/* カードリスト */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-slate-50/30">
        {prepData.length > 0 ? prepData.map((app) => (
          <div key={app.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="px-4 py-1.5 bg-slate-100 text-slate-900 rounded-full text-[10px] font-black tracking-tighter flex items-center gap-1.5">
                <Clock size={12} className="text-indigo-500" />
                {app.start_time.slice(11, 16)}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${app.last_visit ? 'text-slate-300 bg-slate-50' : 'text-indigo-500 bg-indigo-50'}`}>
                {app.last_visit ? 'Regular' : 'New Client'}
              </span>
            </div>

            <div className="mb-4">
              <h4 className="font-black text-slate-900 text-[15px] mb-1 leading-none">{app.customer_name} 様</h4>
              <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-[0.2em]">{app.menu_name}</p>
            </div>

            <div className="bg-slate-50/80 p-5 rounded-[1.8rem] border border-slate-100 group-hover:bg-white transition-colors relative">
              <div className="flex items-center gap-1 opacity-40 mb-2">
                <History size={10} />
                <span className="text-[8px] font-black uppercase tracking-widest">Previous Note</span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed">
                {app.last_memo ? `"${app.last_memo}"` : "特記なし（初回来店または未入力）"}
              </p>
              
              {app.last_visit && (
                <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center text-[8px] font-bold text-slate-300">
                  <span>Last Visit</span>
                  <span className="flex items-center gap-1">
                    {new Date(app.last_visit).toLocaleDateString()}
                    <ChevronRight size={8} />
                  </span>
                </div>
              )}
            </div>
          </div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner border border-slate-100">
              <User size={24} className="opacity-20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">No appointments today</p>
          </div>
        )}
      </div>

      {/* フッター装飾 */}
      <div className="p-6 text-center border-t border-slate-50 bg-white">
        <p className="text-[8px] font-black text-slate-200 uppercase tracking-[0.5em]">Aura Intelligence System</p>
      </div>
    </div>
  );
};