"use client";
import React, { useMemo } from 'react';
import { Sale } from '@/types';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Download, 
  Calendar as CalendarIcon,
  Scissors,
  ShoppingBag,
  CreditCard,
  Banknote,
  Users,
  Target
} from 'lucide-react';

interface Props {
  sales: Sale[];
}

/**
 * 店舗売上の分析と履歴表示
 */
export const SalesView = ({ sales }: Props) => {
  // 1. 集計ロジック
  const stats = useMemo(() => {
    const total = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const net = sales.reduce((sum, s) => sum + (s.net_amount || 0), 0);
    const tax = sales.reduce((sum, s) => sum + (s.tax_amount || 0), 0);
    
    // 支払い方法別
    const byMethod = sales.reduce((acc: Record<string, number>, s) => {
      const methodLabel = s.payment_method === 'cash' ? '現金' : 'カード・QR・他';
      acc[methodLabel] = (acc[methodLabel] || 0) + s.total_amount;
      return acc;
    }, {});

    // スタッフ別集計 (名前がない場合はスタッフIDで代替)
    const byStaff = sales.reduce((acc: Record<string, number>, s) => {
      const staffName = (s as any).staff?.name || s.staff_id || "未設定";
      acc[staffName] = (acc[staffName] || 0) + s.total_amount;
      return acc;
    }, {});

    return { total, net, tax, byMethod, byStaff, count: sales.length };
  }, [sales]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* 📊 KPIサマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 総売上 (税込) */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <Target size={16} className="text-white" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Monthly Gross Revenue</p>
            </div>
            <h3 className="text-5xl font-black italic tracking-tighter mb-2">¥{stats.total.toLocaleString()}</h3>
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <TrendingUp size={14} /> <span>{stats.count} Transactions Completed</span>
            </div>
          </div>
          <TrendingUp className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-700" />
        </div>

        {/* 純売上 (税抜) */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-900">
              <BarChart3 size={16} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Net Sales Value</p>
          </div>
          <h3 className="text-5xl font-black italic tracking-tighter text-slate-900 mb-2">¥{stats.net.toLocaleString()}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">※経理用データ目安 (税抜金額)</p>
          <BarChart3 className="absolute -right-6 -bottom-6 w-40 h-40 text-slate-50 group-hover:text-indigo-50 transition-all duration-700" />
        </div>

        {/* 預かり消費税 */}
        <div className="bg-indigo-50/50 rounded-[3rem] p-10 border border-indigo-100/50 shadow-sm relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <PieChart size={16} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Sales Tax (10%)</p>
          </div>
          <h3 className="text-5xl font-black italic tracking-tighter text-indigo-600 mb-2">¥{stats.tax.toLocaleString()}</h3>
          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">※納税準備額の概算合計</p>
          <PieChart className="absolute -right-6 -bottom-6 w-40 h-40 text-indigo-100 group-hover:rotate-12 transition-all duration-700" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10">
        
        {/* 左カラム: 内訳セクション */}
        <div className="col-span-12 lg:col-span-4 space-y-10">
          
          {/* スタッフ別売上比率 */}
          <div className="bg-white rounded-[4rem] p-10 border border-slate-100 shadow-xl overflow-hidden relative">
            <h4 className="text-xl font-black italic uppercase tracking-tighter mb-10 flex items-center gap-3">
              <Users className="text-indigo-600" /> Staff Performance
            </h4>
            <div className="space-y-8">
              {Object.entries(stats.byStaff).map(([name, amount]) => {
                const percent = stats.total > 0 ? Math.round((amount / stats.total) * 100) : 0;
                return (
                  <div key={name} className="space-y-3 group">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{name}</span>
                      <div className="text-right">
                        <span className="text-sm font-black italic text-slate-900 block">¥{amount.toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-indigo-500 uppercase">{percent}% of Total</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-900 group-hover:bg-indigo-600 rounded-full transition-all duration-1000" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 支払い方法 */}
          <div className="bg-white rounded-[4rem] p-10 border border-slate-100 shadow-xl">
            <h4 className="text-xl font-black italic uppercase tracking-tighter mb-10 flex items-center gap-3">
              <CreditCard className="text-indigo-600" /> Payment Methods
            </h4>
            <div className="space-y-6">
              {Object.entries(stats.byMethod).map(([method, amount]: [string, number]) => (
                <div key={method} className="flex justify-between items-center p-6 bg-slate-50/50 rounded-3xl border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${method === '現金' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                      {method === '現金' ? <Banknote size={20} /> : <CreditCard size={20} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{method}</span>
                  </div>
                  <span className="font-black text-slate-900 text-xl italic">¥{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右カラム: 取引ログ */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col">
          <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div>
              <h4 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <CalendarIcon className="text-indigo-600" /> Transaction Logs
              </h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">リアルタイムの取引履歴</p>
            </div>
            <button className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95">
              <Download size={16} /> Export CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white">
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer / Staff</th>
                  <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service</th>
                  <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="px-10 py-8">
                      <div className="text-xs font-black text-slate-900">
                        {new Date(sale.created_at).toLocaleDateString('ja-JP')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1 flex items-center gap-1">
                        <CalendarIcon size={10} /> {new Date(sale.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {sale.customer_name} 様
                      </div>
                      <div className="text-[9px] text-indigo-400 font-black uppercase mt-1 px-2 py-0.5 bg-indigo-50 rounded inline-block">
                        @{ (sale as any).staff?.name || 'Unassigned' }
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-400 group-hover:text-indigo-500 group-hover:bg-white transition-all shadow-sm">
                          {sale.menu_name.includes('カット') ? <Scissors size={14} /> : <ShoppingBag size={14} />}
                        </div>
                        <span className="text-xs font-black text-slate-600">{sale.menu_name}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="text-lg font-black text-slate-900 italic tracking-tighter">¥{sale.total_amount.toLocaleString()}</div>
                      <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${sale.payment_method === 'cash' ? 'text-emerald-500' : 'text-indigo-400'}`}>
                        {sale.payment_method === 'cash' ? 'Cash' : 'Credit / QR'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sales.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
              <BarChart3 size={48} className="opacity-20 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">No Sales Data Found</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};