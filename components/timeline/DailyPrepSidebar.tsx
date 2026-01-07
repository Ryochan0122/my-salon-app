"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, History, User, Zap, Sparkles } from 'lucide-react';
import { Appointment } from '@/types';

/**
 * 営業前の「カルテ予習」サイドバー
 * 本日の来店客の過去メモや周期を一覧表示
 */
export const DailyPrepSidebar = ({ appointments }: { appointments: Appointment[] }) => {
  const [prepData, setPrepData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLastNotes = async () => {
      if (appointments.length === 0) {
        setPrepData([]);
        return;
      }

      setIsLoading(true);
      try {
        const customerIds = appointments
          .map(app => app.customer_id)
          .filter(id => id !== null && id !== undefined);

        if (customerIds.length === 0) {
          setPrepData(appointments);
          return;
        }

        // 顧客ごとの最新の売上/カルテ履歴を一括取得 (パフォーマンス最適化)
        const { data: lastSales } = await supabase
          .from('sales')
          .select('customer_id, memo, created_at, menu_name')
          .in('customer_id', customerIds)
          .order('created_at', { ascending: false });

        const updatedData = appointments.map(app => {
          // その顧客の最新レコードのみを抽出
          const lastVisit = lastSales?.find(s => s.customer_id === app.customer_id);
          return { 
            ...app, 
            last_memo: lastVisit?.memo, 
            last_visit: lastVisit?.created_at,
            last_menu: lastVisit?.menu_name
          };
        });

        setPrepData(updatedData.sort((a, b) => a.start_time.localeCompare(b.start_time)));
      } catch (error) {
        console.error("Prep error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLastNotes();
  }, [appointments]);

  return (
    <div className="w-full xl:w-[400px] flex-none bg-white rounded-[4rem] shadow-2xl border border-slate-100 flex flex-col h-[88vh] overflow-hidden hidden xl:flex">
      
      {/* ヘッダーエリア */}
      <div className="p-10 border-b border-slate-50 bg-gradient-to-br from-white to-slate-50/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">AI-Powered Insights</p>
        </div>
        <h3 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">
          Morning Prep <span className="text-indigo-600">.</span>
        </h3>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">本日のカルテ予習と重要事項</p>
      </div>

      {/* リストエリア */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-40 gap-4">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loading Records...</p>
          </div>
        ) : prepData.length > 0 ? (
          prepData.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 group hover:border-indigo-200 transition-all duration-500 hover:shadow-xl relative overflow-hidden">
              
              {/* 時間と来店ステータス */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-slate-900 text-white rounded-xl text-[10px] font-black italic">
                    {app.start_time.slice(11, 16)}
                  </div>
                  {app.last_visit ? (
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <Sparkles size={10} /> Repeat
                    </span>
                  ) : (
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md">
                      <Zap size={10} /> New Client
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-bold text-slate-300 uppercase tabular-nums tracking-widest">
                  {app.last_visit ? new Date(app.last_visit).toLocaleDateString('ja-JP') : '---'}
                </span>
              </div>

              {/* 顧客名とメニュー */}
              <div className="mb-4">
                <h4 className="font-black text-slate-900 text-lg mb-1 group-hover:text-indigo-600 transition-colors">
                  {app.customer_name} <span className="text-xs font-normal text-slate-400 italic">様</span>
                </h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {app.menu_name}
                </p>
              </div>

              {/* メモセクション */}
              <div className="relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 rounded-full group-hover:bg-indigo-500 transition-colors" />
                <div className="pl-6">
                  <div className="flex items-center gap-1.5 opacity-40 mb-2">
                    <History size={12} className="text-slate-900" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Previous Note</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed">
                    {app.last_memo ? (
                      `"${app.last_memo}"`
                    ) : (
                      <span className="text-slate-300">過去の施術メモはありません。接客を通じてニーズを確認してください。</span>
                    )}
                  </p>
                  {app.last_menu && (
                    <div className="mt-3 text-[9px] font-black text-indigo-400 uppercase">
                      Last Service: {app.last_menu}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-200 py-20">
            <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6">
              <User size={32} className="opacity-10" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">No appointments today</p>
          </div>
        )}
      </div>

      {/* フッター（クイック・アクション） */}
      <div className="p-8 bg-slate-900 text-white">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Prepared</span>
          <span className="text-2xl font-black italic">{prepData.length}</span>
        </div>
      </div>
    </div>
  );
};