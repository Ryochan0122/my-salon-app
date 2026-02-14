"use client";
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';
import { 
  Trophy, TrendingUp, Users, Scissors, 
  ShoppingBag, Target, ArrowUpRight, Award 
} from 'lucide-react';

interface Props {
  sales: any[];
  staffs: any[];
}

export const ShopAnalytics = ({ sales, staffs }: Props) => {
  
  // 1. 日別売上データの作成
  const dailyData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }).reverse();

    return last7Days.map(date => {
      const daySales = sales.filter(s => 
        new Date(s.created_at).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) === date
      );
      return {
        name: date,
        amount: daySales.reduce((sum, s) => sum + s.total_amount, 0)
      };
    });
  }, [sales]);

  // 2. スタッフ別パフォーマンス
  const staffPerformance = useMemo(() => {
    return staffs.map(staff => {
      const sSales = sales.filter(s => s.staff_id === staff.id);
      const total = sSales.reduce((sum, s) => sum + s.total_amount, 0);
      const count = sSales.length;
      return {
        name: staff.name,
        total,
        count,
        avg: count > 0 ? Math.round(total / count) : 0
      };
    }).sort((a, b) => b.total - a.total);
  }, [sales, staffs]);

  // 3. カテゴリー別比率 (技術 vs 物販)
  const categoryData = useMemo(() => {
    // 実際にはsale_itemsから集計するのが理想的ですが、簡易的にsalesから算出
    const serviceTotal = sales.reduce((sum, s) => sum + (s.total_amount * 0.8), 0); // 仮で8割
    const productTotal = sales.reduce((sum, s) => sum + (s.total_amount * 0.2), 0); // 仮で2割
    return [
      { name: 'Services', value: serviceTotal, color: '#4f46e5' },
      { name: 'Products', value: productTotal, color: '#10b981' }
    ];
  }, [sales]);

  const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 h-[85vh] overflow-y-auto pr-2 custom-scrollbar">
      
      {/* ヘッダー */}
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">AURA <span className="text-indigo-600">Insights</span></h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Business Intelligence for Modern Creators</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[8px] font-black text-slate-400 uppercase">今月の目標達成率</p>
            <p className="text-xl font-black italic text-slate-900">84.2%</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <Target size={20} />
          </div>
        </div>
      </div>

      {/* メインチャート */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* 左側：売上推移グラフ */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-600" /> Revenue Growth (Last 7 Days)
            </h4>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border-none">
                          <p className="text-[10px] font-bold opacity-50 mb-1">{payload[0].payload.name}</p>
                          <p className="text-sm font-black italic">¥{Number(payload[0].value).toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amount" radius={[10, 10, 10, 10]} barSize={40}>
                  {dailyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === dailyData.length - 1 ? '#4f46e5' : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右側：売上比率 */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400/50 mb-8">Profit Source</h4>
          <div className="h-[200px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[8px] font-black text-slate-500 uppercase">Ratio</p>
              <p className="text-xl font-black italic">8:2</p>
            </div>
          </div>
          <div className="space-y-4 mt-4 relative z-10">
            {categoryData.map((item) => (
              <div key={item.name} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
                </div>
                <span className="text-xs font-black italic">¥{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <ShoppingBag size={200} />
          </div>
        </div>
      </div>

      {/* 下段：スタッフランキング */}
      <div className="bg-white rounded-[3.5rem] border border-slate-50 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex justify-between items-center">
          <h4 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
            <Award className="text-indigo-600" /> Staff Performance
          </h4>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">March 2026</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {staffPerformance.map((staff, idx) => (
              <div key={staff.name} className={`p-8 rounded-[2.5rem] border transition-all hover:scale-[1.02] ${idx === 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-transparent'}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black ${idx === 0 ? 'bg-indigo-600 shadow-lg shadow-indigo-200' : 'bg-slate-300'}`}>
                    {idx === 0 ? <Trophy size={18} /> : idx + 1}
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase">客数</p>
                    <p className="font-black italic text-slate-900">{staff.count} <span className="text-[8px] text-slate-400">名</span></p>
                  </div>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Stylist</p>
                <h5 className="text-xl font-black text-slate-900 mb-4">{staff.name}</h5>
                <div className="pt-4 border-t border-slate-200/50">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1">売上合計</p>
                  <p className="text-2xl font-black italic text-slate-900">¥{staff.total.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};