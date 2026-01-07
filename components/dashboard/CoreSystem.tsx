"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Users, Package, Search, 
  Filter, Plus, Star, History,
  Scissors, Paintbrush, ShoppingBag, PieChart,
  ArrowUpRight, AlertTriangle, ChevronRight, Loader2, Sparkles
} from 'lucide-react';
import { supabase, getCurrentShopId } from '@/lib/supabase';

// --- 型定義 ---
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
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. 店舗に紐づくコアデータの取得
  useEffect(() => {
    const fetchCoreData = async () => {
      try {
        setLoading(true);
        const shopId = await getCurrentShopId();
        if (!shopId) return;

        const [appRes, invRes] = await Promise.all([
          supabase
            .from('appointments')
            .select('*')
            .eq('shop_id', shopId) // 👈 店舗フィルタ
            .order('start_time', { ascending: false }),
          supabase
            .from('inventory')
            .select('*')
            .eq('shop_id', shopId) // 👈 店舗フィルタ
        ]);

        if (appRes.data) setAppointments(appRes.data);
        if (invRes.data) setInventory(invRes.data);
      } catch (err) {
        console.error('Dashbord Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCoreData();
  }, []);

  // 2. 経営指標の集計ロジック（店舗データのみを対象）
  const stats = useMemo((): DashboardStats => {
    const completed = appointments.filter(a => a.status === 'completed');
    const total = completed.reduce((sum, a) => sum + (a.total_amount || 0), 0);
    const net = completed.reduce((sum, a) => sum + (a.net_amount || 0), 0);
    
    return {
      totalSales: total,
      netSales: net,
      taxAmount: total - net,
      customerCount: completed.length,
      newCustomerRate: 24, // TODO: 顧客テーブルの初回来店フラグから算出
      averageSpend: completed.length > 0 ? Math.round(total / completed.length) : 0,
      stockAlerts: inventory.filter(i => i.stock <= i.min_stock).length
    };
  }, [appointments, inventory]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 pb-32">
      {/* ヘッダー */}
      <header className="max-w-[1600px] mx-auto mb-12 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 mb-2 uppercase">
            Aura <span className="text-indigo-600">Evolution</span>
          </h1>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">Master Mode</span>
            <p className="text-slate-400 font-bold text-sm tracking-[0.1em]">サロン経営 統合ダッシュボード</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="顧客名・メニュー・スタッフで検索..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 pr-8 py-4 bg-white border-none rounded-[2rem] shadow-sm w-full md:w-[350px] font-bold text-slate-600 focus:ring-4 ring-indigo-100 transition-all"
            />
          </div>
          <button className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95">
            <Plus size={20} />
            <span>新規予約登録</span>
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto space-y-10">
        {/* KPIカード */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: '総売上 (税込)', value: `¥${stats.totalSales.toLocaleString()}`, sub: '完了済みの取引合計', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: '平均客単価', value: `¥${stats.averageSpend.toLocaleString()}`, sub: '今月の平均取引額', icon: Star, color: 'text-indigo-500', bg: 'bg-indigo-50' },
            { label: '総来店数', value: `${stats.customerCount} 名`, sub: '今月の有効来店数', icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' },
            { label: '在庫アラート', value: `${stats.stockAlerts} 件`, sub: '発注が必要な薬剤', icon: Package, color: 'text-rose-500', bg: 'bg-rose-50' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-5 ${item.bg} ${item.color} rounded-[2rem] group-hover:rotate-6 transition-transform`}>
                  <item.icon size={28} />
                </div>
                <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px]">
                  <ArrowUpRight size={14} /> 12%
                </div>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</div>
              <div className="text-4xl font-black italic tracking-tighter text-slate-900">{item.value}</div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-12 gap-10">
          {/* 履歴テーブル */}
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-12 bg-indigo-600 rounded-full shadow-lg shadow-indigo-100" />
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Activity History</h2>
                </div>
              </div>
              <div className="overflow-x-auto">
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
                    {appointments.slice(0, 8).map((app) => (
                      <tr key={app.id} className="group hover:bg-indigo-50/30 transition-all">
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center shadow-lg uppercase">
                              {app.customer_name?.[0]}
                            </div>
                            <div className="font-black text-slate-900">{app.customer_name} 様</div>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-2">
                            {app.menu_name?.includes('カラー') ? <Paintbrush size={14} className="text-rose-400"/> : <Scissors size={14} className="text-indigo-400"/>}
                            <span className="font-bold text-slate-600 text-sm">{app.menu_name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-8">
                          <span className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest shadow-sm">
                            Staff ID: {app.staff_id?.slice(0,4)}
                          </span>
                        </td>
                        <td className="px-8 py-8 font-black text-slate-900 italic">
                          ¥{app.total_amount?.toLocaleString()}
                        </td>
                        <td className="px-8 py-8 text-right">
                          <button className="p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 transition-all shadow-md active:scale-90">
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

          {/* 右サイドパネル */}
          <div className="col-span-12 lg:col-span-4 space-y-10">
            {/* 在庫アラート */}
            <div className="bg-rose-50 p-10 rounded-[4rem] border-4 border-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-rose-500 text-white rounded-[1.5rem] shadow-lg shadow-rose-200">
                    <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-xl font-black italic uppercase text-rose-900">Inventory Alert</h3>
                </div>
                <div className="space-y-4">
                  {inventory.filter(i => i.stock <= i.min_stock).slice(0, 3).map(item => (
                    <div key={item.id} className="bg-white/80 backdrop-blur-md p-6 rounded-[2rem] flex justify-between items-center border border-rose-100">
                      <div>
                        <div className="font-black text-slate-900 text-sm">{item.name}</div>
                        <div className="text-[9px] font-black text-rose-500 uppercase mt-1 tracking-widest">残り {item.stock} / 最低 {item.min_stock}</div>
                      </div>
                      <button className="p-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all shadow-md">
                        <ShoppingBag size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AIインサイト */}
            <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group border border-slate-800">
              <div className="relative z-20">
                <div className="flex items-center gap-3 mb-8">
                  <Sparkles className="text-indigo-400 animate-pulse" size={20} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">AI Business Insights</span>
                </div>
                <p className="text-xl font-bold leading-relaxed italic mb-8">
                  "現在、<span className="text-indigo-400">客単価が上昇傾向</span>にあります。高単価メニューの『髪質改善ケア』をリピーター層へ先行案内することで、今月末の売上目標を5%前倒しで達成できる見込みです。"
                </p>
                <button className="w-full py-5 bg-white/10 hover:bg-indigo-600 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all border border-white/5 shadow-xl group/btn">
                  詳細レポートを生成
                </button>
              </div>
              <PieChart className="absolute -right-16 -bottom-16 text-indigo-500/10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700" size={300} />
            </div>
          </div>
        </div>
      </main>

      {/* フッターナビ（固定） */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-2xl border border-white/10 px-12 py-6 rounded-[3rem] shadow-2xl flex items-center gap-14 z-[200]">
        {[
          { icon: History, label: '履歴' },
          { icon: Users, label: '顧客' },
          { icon: Scissors, label: 'カルテ' },
          { icon: ShoppingBag, label: '在庫' },
          { icon: PieChart, label: '分析' },
        ].map((item, i) => (
          <button key={i} className="flex flex-col items-center gap-1.5 group">
            <div className={`p-2 rounded-xl transition-all ${i === 2 ? 'bg-indigo-600 shadow-lg shadow-indigo-500/50 scale-110' : 'group-hover:bg-white/10'}`}>
              <item.icon size={22} className={i === 2 ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500 group-hover:text-white">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};