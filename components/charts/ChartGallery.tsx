"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Sale, Service, Appointment } from '@/types'; // Appointmentを追加
// Rechartsのインポート
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
// Lucide-reactのアイコン
import { TrendingUp, Users, DollarSign, ShoppingBag, CreditCard } from 'lucide-react';

// Propsの型定義を追加
interface ChartGalleryProps {
  appointments: Appointment[];
}

export const ChartGallery = ({ appointments }: ChartGalleryProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 売上データとサービスデータを取得
      const { data: salesData } = await supabase.from('sales').select('*');
      const { data: servicesData } = await supabase.from('services').select('*');
      setSales(salesData || []);
      setServices(servicesData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // グラフ用集計データ
  const menuStats = services.map((svc, index) => ({
    name: svc.name,
    value: svc.price
  }));

  const methodStats = [
    { name: 'Cash', value: sales.filter(s => s.payment_method === 'cash').length || 0 },
    { name: 'Card', value: sales.filter(s => s.payment_method === 'card').length || 0 },
  ];

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b'];

  if (loading) return (
    <div className="p-20 text-center font-black text-slate-400 animate-pulse">
      ANALYZING BUSINESS DATA...
    </div>
  );

  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* 概要カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><DollarSign size={20}/></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue</span>
          </div>
          <div className="text-4xl font-black italic text-slate-900">¥{totalRevenue.toLocaleString()}</div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Users size={20}/></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Appointments</span>
          </div>
          {/* Propsで受け取った予約数を表示 */}
          <div className="text-4xl font-black italic text-slate-900">{appointments.length}</div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 text-white rounded-2xl"><TrendingUp size={20}/></div>
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Growth Rate</span>
          </div>
          <div className="text-4xl font-black italic">+12.5%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* メニュー別分析 */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <ShoppingBag className="text-indigo-600" size={24} />
            <h4 className="font-black text-xl italic tracking-tighter uppercase text-slate-900">Service Pricing</h4>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={menuStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontWeight: 'bold', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {menuStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 決済方法分析 */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <CreditCard className="text-rose-600" size={24} />
            <h4 className="font-black text-xl italic tracking-tighter uppercase text-slate-900">Payment Ratio</h4>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={methodStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {methodStats.map((entry, index) => (
                    <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-4">
            {methodStats.map((entry, index) => (
              <div key={`legend-${entry.name}`} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};