"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Staff, Service } from '@/types';
import { 
  UserPlus, Scissors, Trash2, Plus, 
  Clock, Info, ShoppingBag, Barcode, Package,
  ArrowUpCircle, ArrowDownCircle, Loader2
} from 'lucide-react';

interface ServiceManagerProps {
  services: Service[];
  onRefresh: () => Promise<void>;
}

export const ServiceManager = ({ services: initialServices, onRefresh }: ServiceManagerProps) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'services' | 'products'>('staff');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. 各データを取得する関数を分離して安定させる
  const fetchStaff = useCallback(async () => {
    const { data } = await supabase.from('staff').select('*').order('created_at', { ascending: true });
    setStaff(data || []);
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('name', { ascending: true });
    setProducts(data || []);
  }, []);

  // 2. タブが切り替わった時だけ、必要なデータを取る（全部一気に取らない）
  useEffect(() => {
    const loadTabData = async () => {
      setLoading(true);
      if (activeTab === 'staff') await fetchStaff();
      if (activeTab === 'products') await fetchProducts();
      // services は親から渡されているのでここで fetch する必要なし
      setLoading(false);
    };
    loadTabData();
  }, [activeTab, fetchStaff, fetchProducts]);

  // アクション完了時の共通処理
  const handleActionComplete = async () => {
    if (activeTab === 'staff') await fetchStaff();
    if (activeTab === 'products') await fetchProducts();
    await onRefresh(); // 親（SettingsView）のサービス一覧を更新
  };

  const adjustStock = async (id: string, currentStock: number, amount: number) => {
    const newStock = Math.max(0, currentStock + amount);
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
    if (!error) handleActionComplete();
  };

  const addStaff = async () => {
    const name = prompt("スタッフ名を入力してください");
    if (!name) return;
    const role = prompt("役職を入力してください", "スタイリスト");
    const { error } = await supabase.from('staff').insert([{ name, role }]);
    if (!error) handleActionComplete();
  };

  const addService = async () => {
    const name = prompt("メニュー名を入力してください");
    if (!name) return;
    const priceStr = prompt("通常料金を入力してください (税込)", "5500");
    const duration = prompt("施術目安時間 (分)", "60");
    if (!priceStr) return;
    const { error } = await supabase.from('services').insert([{ 
      name, price: parseInt(priceStr), tax_rate: 0.10, duration_minutes: parseInt(duration || "60")
    }]);
    if (!error) handleActionComplete();
  };

  const addProduct = async () => {
    const name = prompt("商品名を入力してください");
    if (!name) return;
    const priceStr = prompt("販売価格 (税込)", "3300");
    const stockStr = prompt("初期在庫数", "0");
    if (!priceStr) return;
    const { error } = await supabase.from('products').insert([{
      name, price: parseInt(priceStr), stock: parseInt(stockStr || "0"), tax_rate: 0.10, category: 'retail'
    }]);
    if (!error) handleActionComplete();
  };

  const deleteItem = async (table: string, id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) handleActionComplete();
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-6 flex items-start gap-4">
        <div className="bg-indigo-600 text-white p-2 rounded-xl"><Info size={20} /></div>
        <div>
          <h4 className="font-black text-indigo-900 text-sm italic uppercase tracking-tighter">System Advice</h4>
          <p className="text-indigo-700/80 text-[11px] font-bold mt-1">
            在庫は入荷ボタンで調整してください。会計時に自動で減算されます。
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-10 bg-slate-50 p-2 rounded-[2.5rem] w-fit border border-slate-100">
        {[
          { id: 'staff', label: 'スタッフ', icon: UserPlus },
          { id: 'services', label: 'メニュー', icon: Scissors },
          { id: 'products', label: '在庫/商品', icon: ShoppingBag },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-8 py-4 rounded-[2rem] font-black italic transition-all flex items-center gap-2 text-xs uppercase ${
              activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[4rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase">{activeTab}</h3>
          <button 
            onClick={activeTab === 'staff' ? addStaff : activeTab === 'services' ? addService : addProduct} 
            className="px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black flex items-center gap-3 hover:bg-slate-900 transition-all shadow-xl active:scale-95"
          >
            <Plus size={24} /> <span className="uppercase text-sm">Add New</span>
          </button>
        </div>

        <div className="p-12">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
              <p className="font-black text-slate-300 uppercase text-[10px] tracking-widest">Syncing Data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* スタッフ表示 */}
              {activeTab === 'staff' && staff.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white transition-all shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl italic">{member.name[0]}</div>
                    <div>
                      <div className="font-black text-slate-900 text-xl">{member.name}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.role || 'Stylist'}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteItem('staff', member.id)} className="p-4 text-slate-200 hover:text-rose-500 transition-all"><Trash2 size={24}/></button>
                </div>
              ))}

              {/* メニュー表示（initialServicesを使用） */}
              {activeTab === 'services' && initialServices.map((svc) => (
                <div key={svc.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:bg-white transition-all shadow-sm">
                  <div className="flex items-center gap-8">
                    <div className="p-4 bg-white rounded-2xl text-indigo-600"><Scissors size={28}/></div>
                    <div>
                      <div className="font-black text-slate-900 text-2xl italic">{svc.name}</div>
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase mt-1">
                        <span className="flex items-center gap-1"><Clock size={14}/> {svc.duration_minutes} MIN</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="font-black text-slate-900 text-xl italic">¥{svc.price.toLocaleString()}</div>
                    <button onClick={() => deleteItem('services', svc.id)} className="p-4 text-slate-200 hover:text-rose-500 transition-all"><Trash2 size={24}/></button>
                  </div>
                </div>
              ))}

              {/* 商品表示 */}
              {activeTab === 'products' && products.map((prd) => (
                <div key={prd.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:bg-white transition-all shadow-sm">
                  <div className="flex items-center gap-8">
                    <div className="p-4 bg-white rounded-2xl text-emerald-600"><Package size={28}/></div>
                    <div>
                      <div className="font-black text-slate-900 text-2xl italic">{prd.name}</div>
                      <div className={`text-[10px] font-black uppercase mt-1 flex items-center gap-2 ${prd.stock <= 3 ? 'text-rose-500' : 'text-slate-400'}`}>
                        <Barcode size={14}/> Stock: {prd.stock}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-inner">
                      <button onClick={() => adjustStock(prd.id, prd.stock, 1)} className="px-3 py-1 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all flex flex-col items-center gap-0.5"><ArrowUpCircle size={20} /><span className="text-[8px] font-black">IN</span></button>
                      <button onClick={() => adjustStock(prd.id, prd.stock, -1)} className="px-3 py-1 text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex flex-col items-center gap-0.5"><ArrowDownCircle size={20} /><span className="text-[8px] font-black">OUT</span></button>
                    </div>
                    <div className="font-black text-emerald-600 text-xl italic min-w-[100px] text-right">¥{prd.price.toLocaleString()}</div>
                    <button onClick={() => deleteItem('products', prd.id)} className="p-4 text-slate-200 hover:text-rose-500 transition-all"><Trash2 size={24}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};