"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Users, Package, AlertTriangle, ChevronRight, Search, 
  Plus, Star, Scissors, ShoppingBag, PieChart, Clock, LayoutDashboard, 
  BarChart3, Camera, Zap, CreditCard, X, ArrowUpRight, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
// 1. 外部ファイルを優先し、ここのインポートを活かす
import { CheckoutModal } from '../admin/CheckoutModal';

// --- 型定義 ---
type ViewState = 'dashboard' | 'customers' | 'inventory' | 'analytics';

interface Customer {
  id: string;
  name: string;
  kana?: string;
  tel?: string;
  shop_id: string;
}

interface Sale {
  id: string;
  customer_id: string;
  customer_name: string;
  total_amount: number;
  menu_name: string;
  memo?: string;
  image_url?: string;
  created_at: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: 'service' | 'product';
  stock: number;
  min_stock: number;
  price: number;
}

// 2. 【重要】ここにあった `const CheckoutModal = ...` の定義を丸ごと削除しました。
// これでインポートとの名前衝突 (ts 2440) が解消されます。

export const CoreSystem = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [targetCustomer, setTargetCustomer] = useState<any>(null);

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllData = async (sid: string) => {
    const [invRes, custRes, saleRes] = await Promise.all([
      supabase.from('inventory').select('*').eq('shop_id', sid).order('name', { ascending: true }),
      supabase.from('customers').select('*').eq('shop_id', sid).order('name', { ascending: true }),
      supabase.from('sales').select('*').eq('shop_id', sid).order('created_at', { ascending: false })
    ]);
    setInventory(invRes.data || []);
    setCustomers(custRes.data || []);
    setSales(saleRes.data || []);
  };

  useEffect(() => {
    const id = localStorage.getItem('aura_shop_id');
    setShopId(id);
    if (id) fetchAllData(id).then(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    return {
      totalSales: total,
      customerCount: customers.length,
      averageSpend: sales.length > 0 ? Math.round(total / sales.length) : 0,
      stockAlerts: inventory.filter(i => i.stock <= i.min_stock).length
    };
  }, [sales, inventory, customers]);

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    const { data } = await supabase.from('sales').select('*').eq('customer_id', customer.id).order('created_at', { ascending: false });
    setCustomerSales(data || []);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-black italic">LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 pb-32 font-sans">
      <header className="max-w-[1600px] mx-auto mb-12 flex justify-between items-center">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter text-slate-900 uppercase">
            Aura <span className="text-indigo-600">Evolution</span>
          </h1>
        </div>
        <button onClick={() => { setTargetCustomer({ name: '新規お客様', id: null }); setShowCheckout(true); }} className="px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all">
          Quick Checkout
        </button>
      </header>

      <main className="max-w-[1600px] mx-auto">
        {view === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in duration-500">
            <StatCard label="Revenue" value={`¥${stats.totalSales.toLocaleString()}`} icon={TrendingUp} color="text-emerald-500" bg="bg-emerald-50" />
            <StatCard label="Unit Price" value={`¥${stats.averageSpend.toLocaleString()}`} icon={Star} color="text-indigo-500" bg="bg-indigo-50" />
            <StatCard label="Clients" value={`${stats.customerCount}名`} icon={Users} color="text-orange-500" bg="bg-orange-50" />
            <StatCard label="Alerts" value={`${stats.stockAlerts}件`} icon={Package} color="text-rose-500" bg="bg-rose-50" />
          </div>
        )}

        {view === 'customers' && (
          <div className="flex gap-8 h-[70vh] animate-in fade-in duration-500">
            <div className="w-80 bg-white rounded-[2.5rem] p-4 overflow-y-auto border border-slate-100">
              {customers.map(c => (
                <button key={c.id} onClick={() => handleSelectCustomer(c)} className={`w-full p-4 rounded-xl text-left mb-2 font-black text-sm ${selectedCustomer?.id === c.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-50'}`}>
                  {c.name}
                </button>
              ))}
            </div>
            <div className="flex-1 bg-white rounded-[4rem] p-12 overflow-y-auto border border-slate-50">
              {selectedCustomer ? (
                <div>
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-4xl font-black italic">{selectedCustomer.name} 様</h2>
                    <button onClick={() => { setTargetCustomer(selectedCustomer); setShowCheckout(true); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs">Checkout</button>
                  </div>
                  {customerSales.map(s => (
                    <div key={s.id} className="p-6 bg-slate-50 rounded-3xl mb-4 flex justify-between group hover:bg-white hover:shadow-xl transition-all">
                      <span className="font-bold">{s.menu_name}</span>
                      <span className="font-black italic">¥{s.total_amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="h-full flex items-center justify-center text-slate-300 font-black tracking-widest">SELECT CLIENT</div>}
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="bg-white rounded-[3.5rem] overflow-hidden border border-slate-100">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest">
                <tr><th className="px-10 py-6">Product</th><th className="px-6 py-6">Stock</th><th className="px-6 py-6">Price</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inventory.map(item => (
                  <tr key={item.id} className="font-bold hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6">{item.name}</td>
                    <td className={`px-6 py-6 ${item.stock <= item.min_stock ? 'text-rose-500' : ''}`}>{item.stock}</td>
                    <td className="px-6 py-6">¥{item.price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 px-12 py-6 rounded-[3.5rem] flex gap-12 text-white shadow-2xl border border-white/5">
        <NavBtn active={view === 'dashboard'} icon={LayoutDashboard} label="Home" onClick={() => setView('dashboard')} />
        <NavBtn active={view === 'customers'} icon={Users} label="Clients" onClick={() => setView('customers')} />
        <NavBtn active={view === 'inventory'} icon={ShoppingBag} label="Stock" onClick={() => setView('inventory')} />
      </nav>

      {/* 3. 外部ファイル版の CheckoutModal が呼ばれる */}
      {showCheckout && <CheckoutModal customer={targetCustomer} onClose={() => setShowCheckout(false)} onSuccess={() => { fetchAllData(shopId!); setShowCheckout(false); }} />}
    </div>
  );
};

// --- HELPER COMPONENTS ---
const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 group relative overflow-hidden">
    <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform`}><Icon size={24} /></div>
    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</p>
    <p className="text-3xl font-black italic tracking-tighter">{value}</p>
    <ArrowUpRight className="absolute top-8 right-8 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
  </div>
);

const NavBtn = ({ active, icon: Icon, label, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-indigo-400 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
    <Icon size={22} />
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);