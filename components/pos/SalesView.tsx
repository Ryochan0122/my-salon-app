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
  Users
} from 'lucide-react';

interface Props {
  sales: Sale[];
}

export const SalesView = ({ sales }: Props) => {
  // 集計ロジック
  const stats = useMemo(() => {
    const total = sales.reduce((sum, s) => sum + s.total_amount, 0);
    const net = sales.reduce((sum, s) => sum + (s.net_amount || 0), 0);
    const tax = sales.reduce((sum, s) => sum + (s.tax_amount || 0), 0);
    
    const byMethod = sales.reduce((acc: Record<string, number>, s) => {
      // 表示用の日本語にマッピング
      const methodLabel = s.payment_method === 'cash' ? '現金' : 'カード・その他';
      acc[methodLabel] = (acc[methodLabel] || 0) + s.total_amount;
      return acc;
    }, {});

    // スタッフ別集計
    const byStaff = sales.reduce((acc: Record<string, number>, s) => {
      const name = s.staff?.name || "未設定";
      acc[name] = (acc[name] || 0) + s.total_amount;
      return acc;
    }, {});

    return { total, net, tax, byMethod, byStaff, count: sales.length };
  }, [sales]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* 1. クイック・スタッツ・カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">総売上額 (税込)</p>
            <h3 className="text-4xl font-black italic tracking-tighter">¥{stats.total.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <TrendingUp size={14} /> <span>{stats.count} 件の取引</span>
            </div>
          </div>
          <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform" />
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">税抜売上 (純売上)</p>
          <h3 className="text-4xl font-black italic tracking-tighter text-slate-900">¥{stats.net.toLocaleString()}</h3>
          <p className="mt-4 text-[10px] font-bold text-slate-400">※確定申告用の売上高目安</p>
          <BarChart3 className="absolute -right-4 -bottom-4 w-32 h-32 text-slate-50 group-hover:text-indigo-50 transition-colors" />
        </div>

        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-2">消費税額 (合計)</p>
          <h3 className="text-4xl font-black italic tracking-tighter">¥{stats.tax.toLocaleString()}</h3>
          <p className="mt-4 text-[10px] font-bold text-indigo-200">※預かり消費税の概算</p>
          <PieChart className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:rotate-12 transition-transform" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* 左カラム: 支払い内訳とスタッフ貢献度 */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          
          {/* スタッフ別貢献度 */}
          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl">
            <h4 className="text-lg font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
              <Users className="text-indigo-600" /> スタッフ別売上
            </h4>
            <div className="space-y-6">
              {Object.entries(stats.byStaff).map(([name, amount]) => {
                const percent = stats.total > 0 ? Math.round((amount / stats.total) * 100) : 0;
                return (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black uppercase text-slate-900">{name}</span>
                      <span className="text-xs font-black text-slate-400">¥{amount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 支払い内訳 */}
          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-xl">
            <h4 className="text-lg font-black italic uppercase tracking-tighter mb-8 flex items-center gap-3">
              <CreditCard className="text-indigo-600" /> 支払い方法の内訳
            </h4>
            <div className="space-y-6">
              {Object.entries(stats.byMethod).map(([method, amount]: [string, number]) => (
                <div key={method} className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-900">
                      {method === '現金' ? <Banknote size={18} /> : <CreditCard size={18} />}
                    </div>
                    <span className="text-xs font-black uppercase text-slate-500">{method}</span>
                  </div>
                  <span className="font-black text-slate-900 text-lg">¥{amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">レジ内 現金残高</p>
              <p className="text-2xl font-black text-slate-900 italic">¥{(stats.byMethod['現金'] || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* 右カラム: 取引履歴 */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-10 border-b border-slate-50 flex justify-between items-center">
            <h4 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
              <CalendarIcon className="text-indigo-600" /> 取引ログ (履歴)
            </h4>
            <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all">
              <Download size={14} /> CSV出力
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">日時</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">お客様名</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">施術内容</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="text-xs font-black text-slate-900">
                        {new Date(sale.created_at).toLocaleDateString('ja-JP')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold">
                        {new Date(sale.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {sale.customer_name} 様
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        担当: {sale.staff?.name || '未設定'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black text-slate-600 uppercase">
                        {sale.menu_name.includes('カット') ? <Scissors size={10} /> : <ShoppingBag size={10} />}
                        {sale.menu_name}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="text-sm font-black text-slate-900 italic">¥{sale.total_amount.toLocaleString()}</div>
                      <div className="text-[9px] text-emerald-500 font-bold tracking-tighter uppercase">
                        {sale.payment_method === 'cash' ? '現金' : 'カード・他'}
                      </div>
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