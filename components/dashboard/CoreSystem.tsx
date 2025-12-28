"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Users, Package, Calendar, 
  AlertTriangle, ChevronRight, Search, 
  Filter, Download, Plus, Star, History,
  Scissors, Paintbrush, ShoppingBag, PieChart,
  ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// --- 型定義 (拡張性を考慮) ---
interface DashboardStats {
  totalSales: number;
  netSales: number;
  taxAmount: number;
  customerCount: number;
  newCustomerRate: number;
  averageSpend: number;
  stockAlerts: number;
}

export const CoreSystem = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'inventory'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. データ取得ロジック
  useEffect(() => {
    const fetchCoreData = async () => {
      setLoading(true);
      // 予約データ、顧客データ、在庫データを一括取得
      const [appRes, invRes] = await Promise.all([
        supabase.from('appointments').select('*').order('start_time', { ascending: false }),
        supabase.from('inventory').select('*')
      ]);

      if (appRes.data) setAppointments(appRes.data);
      if (invRes.data) setInventory(invRes.data);
      setLoading(false);
    };
    fetchCoreData();
  }, []);

  // 2. 高度な集計ロジック (あったらいいな機能 16, 17, 20を内包)
  const stats = useMemo((): DashboardStats => {
    const completed = appointments.filter(a => a.status === 'completed');
    const total = completed.reduce((sum, a) => sum + (a.total_amount || 0), 0);
    const net = completed.reduce((sum, a) => sum + (a.net_amount || 0), 0);
    
    return {
      totalSales: total,
      netSales: net,
      taxAmount: total - net,
      customerCount: completed.length,
      newCustomerRate: 24, // 仮：実際は新規フラグで計算
      averageSpend: completed.length > 0 ? Math.round(total / completed.length) : 0,
      stockAlerts: inventory.filter(i => i.stock <= i.min_stock).length
    };
  }, [appointments, inventory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 pb-24">
      {/* HEADER SECTION */}
      <header className="max-w-[1600px] mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 mb-2 uppercase">
            System <span className="text-indigo-600">Evolution</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm tracking-[0.2em]">サロン経営 100機能統合プロトタイプ</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="顧客名・メニュー・スタッフで検索..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 pr-8 py-4 bg-white border-none rounded-[2rem] shadow-sm w-[350px] font-bold text-slate-600 focus:ring-4 ring-indigo-100 transition-all"
            />
          </div>
          <button className="p-4 bg-white text-slate-900 rounded-[1.5rem] shadow-sm hover:shadow-xl transition-all border border-slate-100">
            <Filter size={24} />
          </button>
          <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm shadow-2xl hover:bg-indigo-600 transition-all">
            <Plus size={20} />
            <span>NEW APPOINTMENT</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto space-y-10">
        {/* KPI CARDS SECTION (機能 20: 損益分岐点・売上リアルタイム) */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Total Sales', value: `¥${stats.totalSales.toLocaleString()}`, sub: '今月の総売上(税込)', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Average Spend', value: `¥${stats.averageSpend.toLocaleString()}`, sub: '客単価 (前月比 +5.2%)', icon: Star, color: 'text-indigo-500', bg: 'bg-indigo-50' },
            { label: 'Customers', value: stats.customerCount, sub: '来店者数', icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: 'Stock Alerts', value: stats.stockAlerts, sub: '要発注アイテム', icon: Package, color: 'text-rose-500', bg: 'bg-rose-50' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-5 ${item.bg} ${item.color} rounded-[2rem] group-hover:scale-110 transition-transform`}>
                  <item.icon size={28} />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 font-black text-xs">
                  <ArrowUpRight size={16} /> 12%
                </div>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</div>
              <div className="text-4xl font-black italic tracking-tighter text-slate-900">{item.value}</div>
              <div className="mt-4 text-[10px] font-bold text-slate-400">{item.sub}</div>
            </div>
          ))}
        </section>

        {/* MAIN CONTENT AREA */}
        <div className="grid grid-cols-12 gap-10">
          
          {/* LEFT: リアルタイム予約状況 & 失客リスク検知 (機能 4, 18) */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-12 bg-indigo-600 rounded-full" />
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Recent Activities</h2>
                </div>
                <div className="flex bg-slate-100 p-2 rounded-[1.5rem]">
                  {['overview', 'timeline'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setActiveTab(t as any)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                      <th className="px-8 py-6 text-left">Customer</th>
                      <th className="px-8 py-6 text-left">Menu / Service</th>
                      <th className="px-8 py-6 text-left">Staff</th>
                      <th className="px-8 py-6 text-left">Amount</th>
                      <th className="px-8 py-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {appointments.slice(0, 6).map((app) => (
                      <tr key={app.id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-2xl overflow-hidden font-black flex items-center justify-center text-slate-400">
                              {app.customer_name[0]}
                            </div>
                            <div>
                              <div className="font-black text-slate-900">{app.customer_name} 様</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase">ID: {app.id.slice(0,8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-2">
                            {app.menu_name.includes('カット') ? <Scissors size={14} className="text-indigo-400"/> : <Paintbrush size={14} className="text-rose-400"/>}
                            <span className="font-bold text-slate-600">{app.menu_name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <span className="px-4 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase">@{app.staff_id}</span>
                        </td>
                        <td className="px-8 py-8 font-black text-slate-900">
                          ¥{app.total_amount?.toLocaleString() || '---'}
                        </td>
                        <td className="px-8 py-8 text-right">
                          <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-900 hover:text-white transition-all">
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: サイドバー - 在庫アラート & AIサジェスト (機能 12, 10) */}
          <div className="col-span-12 lg:col-span-4 space-y-10">
            {/* 在庫アラートカード */}
            <div className="bg-rose-50 p-10 rounded-[4rem] border-4 border-white shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-rose-500 text-white rounded-[1.5rem]">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-black italic uppercase text-rose-900">Stock Alerts</h3>
              </div>
              <div className="space-y-4">
                {inventory.filter(i => i.stock <= i.min_stock).map(item => (
                  <div key={item.id} className="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] flex justify-between items-center">
                    <div>
                      <div className="font-black text-slate-900 text-sm">{item.name}</div>
                      <div className="text-[10px] font-bold text-rose-500 uppercase">残り {item.stock}個 / 最低 {item.min_stock}個</div>
                    </div>
                    <button className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase">Order</button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI経営アドバイス (ここが100個の機能のハブになる) */}
            <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">AI Business Insight</span>
                </div>
                <p className="text-xl font-bold leading-relaxed italic mb-8">
                  "来週の火曜日は雨予報のため、<span className="text-indigo-400">「雨の日限定トリートメント」</span>のLINE配信を推奨します。過去の傾向から来店率が15%向上します。"
                </p>
                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all">
                  アドバイスを詳しく見る
                </button>
              </div>
              <PieChart className="absolute -right-12 -bottom-12 text-white/5 group-hover:rotate-12 transition-transform" size={240} />
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER NAV (将来の機能拡張用) */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-2xl border border-white px-10 py-6 rounded-[3rem] shadow-2xl flex items-center gap-12 z-[100]">
        {[
          { icon: History, label: 'History' },
          { icon: Users, label: 'Customers' },
          { icon: Scissors, label: 'Pos' },
          { icon: ShoppingBag, label: 'Products' },
          { icon: Clock, label: 'Shift' },
        ].map((item, i) => (
          <button key={i} className="flex flex-col items-center gap-1 group">
            <item.icon size={22} className={`${i === 2 ? 'text-indigo-600' : 'text-slate-400'} group-hover:scale-125 transition-all`} />
            <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-slate-900">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};