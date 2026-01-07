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

// --- 型定義 ---
interface DashboardStats {
  totalSales: number;     // 総売上
  netSales: number;       // 純売上
  taxAmount: number;      // 消費税
  customerCount: number;  // 来店数
  newCustomerRate: number; // 新規率
  averageSpend: number;   // 客単価
  stockAlerts: number;    // 在庫警告数
}

export const CoreSystem = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. データ取得
  useEffect(() => {
    const fetchCoreData = async () => {
      setLoading(true);
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

  // 2. 経営指標の集計ロジック
  const stats = useMemo((): DashboardStats => {
    const completed = appointments.filter(a => a.status === 'completed');
    const total = completed.reduce((sum, a) => sum + (a.total_amount || 0), 0);
    const net = completed.reduce((sum, a) => sum + (a.net_amount || 0), 0);
    
    return {
      totalSales: total,
      netSales: net,
      taxAmount: total - net,
      customerCount: completed.length,
      newCustomerRate: 24, // 実装予定：新規フラグで計算
      averageSpend: completed.length > 0 ? Math.round(total / completed.length) : 0,
      stockAlerts: inventory.filter(i => i.stock <= i.min_stock).length
    };
  }, [appointments, inventory]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 pb-24">
      {/* ヘッダーセクション */}
      <header className="max-w-[1600px] mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 mb-2 uppercase">
            Aura <span className="text-indigo-600">Evolution</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm tracking-[0.2em]">サロン経営 統合ダッシュボード</p>
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
            <span>新規予約登録</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto space-y-10">
        {/* KPIカードセクション */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: '総売上 (税込)', value: `¥${stats.totalSales.toLocaleString()}`, sub: '今月の累計売上', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: '平均客単価', value: `¥${stats.averageSpend.toLocaleString()}`, sub: '前月比 +5.2%', icon: Star, color: 'text-indigo-500', bg: 'bg-indigo-50' },
            { label: '総来店数', value: `${stats.customerCount} 名`, sub: '完了済みの取引件数', icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: '在庫アラート', value: `${stats.stockAlerts} 件`, sub: '要発注アイテム数', icon: Package, color: 'text-rose-500', bg: 'bg-rose-50' },
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

        <div className="grid grid-cols-12 gap-10">
          
          {/* 左：最近の稼働状況 */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-12 bg-indigo-600 rounded-full" />
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">最近の予約・活動履歴</h2>
                </div>
                <div className="flex bg-slate-100 p-2 rounded-[1.5rem]">
                  {[
                    { id: 'overview', label: '概要' },
                    { id: 'timeline', label: 'タイムライン' }
                  ].map(t => (
                    <button 
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-4">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                      <th className="px-8 py-6 text-left">お客様名</th>
                      <th className="px-8 py-6 text-left">施術メニュー</th>
                      <th className="px-8 py-6 text-left">担当者</th>
                      <th className="px-8 py-6 text-left">合計金額</th>
                      <th className="px-8 py-6 text-right">詳細</th>
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

          {/* 右：在庫アラート & AIインサイト */}
          <div className="col-span-12 lg:col-span-4 space-y-10">
            {/* 在庫アラート */}
            <div className="bg-rose-50 p-10 rounded-[4rem] border-4 border-white shadow-xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-rose-500 text-white rounded-[1.5rem]">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-black italic uppercase text-rose-900">在庫警告</h3>
              </div>
              <div className="space-y-4">
                {inventory.filter(i => i.stock <= i.min_stock).map(item => (
                  <div key={item.id} className="bg-white/60 backdrop-blur-md p-6 rounded-[2rem] flex justify-between items-center">
                    <div>
                      <div className="font-black text-slate-900 text-sm">{item.name}</div>
                      <div className="text-[10px] font-bold text-rose-500 uppercase">残り {item.stock}個 / 最低在庫 {item.min_stock}個</div>
                    </div>
                    <button className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase">発注</button>
                  </div>
                ))}
              </div>
            </div>

            {/* AI経営アドバイス */}
            <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">AI ビジネス・インサイト</span>
                </div>
                <p className="text-xl font-bold leading-relaxed italic mb-8">
                  "来週の火曜日は雨予報のため、<span className="text-indigo-400">「雨の日限定トリートメント」</span>の公式LINE配信を推奨します。過去の傾向から来店率が15%向上する可能性があります。"
                </p>
                <button className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all">
                  詳細分析を表示
                </button>
              </div>
              <PieChart className="absolute -right-12 -bottom-12 text-white/5 group-hover:rotate-12 transition-transform" size={240} />
            </div>
          </div>

        </div>
      </main>

      {/* フッターナビゲーション */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-2xl border border-white px-10 py-6 rounded-[3rem] shadow-2xl flex items-center gap-12 z-[100]">
        {[
          { icon: History, label: '履歴' },
          { icon: Users, label: '顧客管理' },
          { icon: Scissors, label: '会計' },
          { icon: ShoppingBag, label: '在庫' },
          { icon: Clock, label: 'シフト' },
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