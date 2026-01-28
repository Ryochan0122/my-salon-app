"use client";
import React, { useMemo, useState } from 'react';
import { Sale } from '@/types';
import { 
  TrendingUp, BarChart3, PieChart, Download, 
  Calendar as CalendarIcon, Scissors, ShoppingBag, 
  CreditCard, Banknote, Users, Target, Rocket, Award
} from 'lucide-react';

interface Props {
  sales: Sale[];
}

export const SalesView = ({ sales }: Props) => {
  const [viewMode, setViewMode] = useState<'today' | 'month' | 'year' | 'all'>('month');

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('ja-JP');
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // フィルタリング
    const filteredSales = sales.filter(s => {
      const d = new Date(s.created_at);
      if (viewMode === 'today') return d.toLocaleDateString('ja-JP') === todayStr;
      if (viewMode === 'month') return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      if (viewMode === 'year') return d.getFullYear() === thisYear;
      return true;
    });

    const total = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
    const count = filteredSales.length;
    const average = count > 0 ? Math.round(total / count) : 0; // 客単価

    // 日別集計（レポート用）
    const byDate = filteredSales.reduce((acc: Record<string, any>, s) => {
      const date = new Date(s.created_at).toLocaleDateString('ja-JP');
      if (!acc[date]) acc[date] = { total: 0, cash: 0, card: 0 };
      acc[date].total += s.total_amount;
      if (s.payment_method === 'cash') acc[date].cash += s.total_amount;
      else acc[date].card += s.total_amount;
      return acc;
    }, {});

    return { total, count, average, byDate, filteredSales };
  }, [sales, viewMode]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. 期間切り替えタブ */}
      <div className="flex bg-slate-100 p-1.5 rounded-[2rem] w-fit border border-slate-200 shadow-inner">
        {[
          { id: 'today', label: '今日', icon: <Target size={14} /> },
          { id: 'month', label: '今月', icon: <Rocket size={14} /> },
          { id: 'year', label: '今年', icon: <Award size={14} /> },
          { id: 'all', label: '全期間', icon: <BarChart3 size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as any)}
            className={`flex items-center gap-2 px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
              viewMode === tab.id 
              ? 'bg-slate-900 text-white shadow-lg scale-105' 
              : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 2. モチベーション・ダッシュボード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
              {viewMode === 'month' ? '今月の売上' : viewMode === 'year' ? '今年の売上' : '売上合計'}
            </p>
            <h3 className="text-5xl font-black italic tracking-tighter">¥{stats.total.toLocaleString()}</h3>
            <div className="mt-6 flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <TrendingUp size={16} /> <span>順調に推移しています</span>
            </div>
          </div>
          <TrendingUp className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5 group-hover:scale-125 transition-transform duration-700" />
        </div>

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">総客数</p>
          <h3 className="text-5xl font-black italic tracking-tighter text-slate-900">{stats.count} <span className="text-xl">名</span></h3>
          <p className="mt-6 text-[10px] font-bold text-slate-400 flex items-center gap-2">
            <Users size={14} className="text-indigo-600" /> たくさんのご来店ありがとうございます！
          </p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">客単価</p>
          <h3 className="text-5xl font-black italic tracking-tighter text-slate-900">¥{stats.average.toLocaleString()}</h3>
          <p className="mt-6 text-[10px] font-bold text-slate-400 flex items-center gap-2">
            <Award size={14} className="text-amber-500" /> サービスの質を維持できています
          </p>
        </div>
      </div>

      {/* 3. 日別レポート & 取引ログ */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* 日別売上（左：確定申告・分析用） */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex justify-between items-center">
            <h4 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
              <CalendarIcon className="text-indigo-600" /> 日別集計
            </h4>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                <tr className="bg-slate-50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">日付</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase text-right">合計</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-bold">
                {Object.entries(stats.byDate).sort((a, b) => b[0].localeCompare(a[0])).map(([date, data]: any) => (
                  <tr key={date} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 text-sm text-slate-900 italic font-black">{date}</td>
                    <td className="px-8 py-5 text-sm text-slate-900 text-right font-black italic">¥{data.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 取引ログ（右：詳細確認用） */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-10 border-b border-slate-50">
            <h4 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
              <BarChart3 className="text-indigo-600" /> 取引明細
            </h4>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left">
              <tbody className="divide-y divide-slate-50">
                {stats.filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-8 py-5">
                      <div className="text-[10px] text-slate-400 font-bold">{new Date(sale.created_at).toLocaleDateString('ja-JP')}</div>
                      <div className="text-xs font-black text-slate-900">{sale.customer_name} 様</div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="text-[10px] text-indigo-600 font-black uppercase">{sale.menu_name}</div>
                    </td>
                    <td className="px-8 py-5 text-right font-black italic text-slate-900">
                      ¥{sale.total_amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};