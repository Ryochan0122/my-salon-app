"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Staff, Service } from '@/types';
import { 
  UserPlus, Scissors, Trash2, Plus, 
  Clock, Info, ShoppingBag, Barcode, Package, Percent
} from 'lucide-react';

// Propsの型定義を追加
interface ServiceManagerProps {
  services: Service[];
  onRefresh: () => Promise<void>;
}

export const ServiceManager = ({ services: initialServices, onRefresh }: ServiceManagerProps) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'services' | 'products'>('staff');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>(initialServices);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 初回読み込みとタブ切り替え時のデータ取得
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Propsのservicesが更新されたら反映
  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: stf } = await supabase.from('staff').select('*').order('created_at', { ascending: true });
      const { data: svc } = await supabase.from('services').select('*').order('price', { ascending: true });
      const { data: prd } = await supabase.from('products').select('*').order('name', { ascending: true });
      
      setStaff(stf || []);
      setServices(svc || initialServices);
      setProducts(prd || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionComplete = async () => {
    await fetchData();
    await onRefresh(); // 親コンポーネント(page.tsx)のデータも更新
  };

  const addStaff = async () => {
    const name = prompt("スタッフ名を入力してください");
    const role = prompt("役職 (例: 店長, スタイリスト)", "Stylist");
    if (!name) return;
    const { error } = await supabase.from('staff').insert([{ name, role }]);
    if (!error) handleActionComplete();
  };

  const addService = async () => {
    const name = prompt("メニュー名 (例: カット＆カラー)");
    if (!name) return;
    const priceStr = prompt("通常料金 (税込)", "5500");
    const duration = prompt("目安時間 (分)", "60");
    if (!priceStr) return;

    const basePrice = parseInt(priceStr);
    const { error } = await supabase.from('services').insert([{ 
      name, 
      price: basePrice,
      price_student: basePrice,
      price_child: basePrice,
      tax_rate: 0.10,
      duration_minutes: parseInt(duration || "60")
    }]);
    if (!error) handleActionComplete();
  };

  const addProduct = async () => {
    const name = prompt("商品名 (例: シャンプー)");
    if (!name) return;
    const priceStr = prompt("販売価格 (税込)", "3300");
    const stockStr = prompt("初期在庫数", "0");
    if (!priceStr) return;

    const { error } = await supabase.from('products').insert([{
      name,
      price: parseInt(priceStr),
      stock: parseInt(stockStr || "0"),
      tax_rate: 0.10,
      category: 'retail'
    }]);
    if (!error) handleActionComplete();
  };

  const deleteItem = async (table: string, id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) handleActionComplete();
  };

  if (loading) return (
    <div className="p-20 text-center">
      <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
      <p className="font-black text-slate-400 italic">SYNCING MANAGEMENT DATA...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      
      {/* 確定申告アドバイスパネル */}
      <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm">
        <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg">
          <Info size={20} />
        </div>
        <div>
          <h4 className="font-black text-indigo-900 text-sm">確定申告（青色申告）をスムーズにする設定</h4>
          <p className="text-indigo-700/80 text-xs font-bold leading-relaxed mt-1">
            メニューや商品は、普段お使いの<span className="text-indigo-900 underline decoration-indigo-300 decoration-2 underline-offset-4">「税込価格」</span>で設定してください。
            会計時にシステムが消費税額を自動で逆算し、確定申告に必要な「税抜売上」と「消費税」を正確に記録・集計します。
          </p>
        </div>
      </div>

      {/* タブスイッチ */}
      <div className="flex gap-4 mb-10 bg-white p-2 rounded-[2.5rem] shadow-sm w-fit border border-slate-100">
        <button onClick={() => setActiveTab('staff')} className={`px-8 py-4 rounded-[2rem] font-black italic transition-all flex items-center gap-2 ${activeTab === 'staff' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}><UserPlus size={18} /> STAFF</button>
        <button onClick={() => setActiveTab('services')} className={`px-8 py-4 rounded-[2rem] font-black italic transition-all flex items-center gap-2 ${activeTab === 'services' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}><Scissors size={18} /> SERVICES</button>
        <button onClick={() => setActiveTab('products')} className={`px-8 py-4 rounded-[2rem] font-black italic transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}><ShoppingBag size={18} /> PRODUCTS</button>
      </div>

      <div className="bg-white rounded-[4rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase">{activeTab}</h3>
          <button 
            onClick={activeTab === 'staff' ? addStaff : activeTab === 'services' ? addService : addProduct} 
            className="px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black flex items-center gap-3 hover:bg-slate-900 transition-all shadow-xl"
          >
            <Plus size={24} />
            <span>ADD NEW {activeTab.slice(0, -1).toUpperCase()}</span>
          </button>
        </div>

        <div className="p-12">
          {activeTab === 'staff' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {staff.map(member => (
                <div key={member.id} className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white transition-all">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl">{member.name[0]}</div>
                    <div className="font-black text-slate-900 text-xl">{member.name}</div>
                  </div>
                  <button onClick={() => deleteItem('staff', member.id)} className="p-4 text-slate-200 hover:text-rose-500 transition-all"><Trash2 size={24}/></button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              {services.map(svc => (
                <div key={svc.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:bg-white transition-all">
                  <div className="flex items-center gap-8">
                    <div className="p-4 bg-white rounded-2xl text-indigo-600"><Scissors size={28}/></div>
                    <div>
                      <div className="font-black text-slate-900 text-2xl italic">{svc.name}</div>
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase mt-1">
                        <span className="flex items-center gap-1"><Clock size={14}/> {svc.duration_minutes} 分</span>
                        <span className="flex items-center gap-1"><Percent size={14}/> 消費税 10% (内税)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-black text-slate-900 text-xl">¥{svc.price.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">通常価格 (税込)</div>
                    </div>
                    <button onClick={() => deleteItem('services', svc.id)} className="p-4 text-slate-200 hover:text-rose-500 transition-all"><Trash2 size={24}/></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              {products.map(prd => (
                <div key={prd.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group hover:bg-white transition-all">
                  <div className="flex items-center gap-8">
                    <div className="p-4 bg-white rounded-2xl text-emerald-600"><Package size={28}/></div>
                    <div>
                      <div className="font-black text-slate-900 text-2xl italic">{prd.name}</div>
                      <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase mt-1">
                        <span className="flex items-center gap-1"><Barcode size={14}/> 在庫: {prd.stock}個</span>
                        <span className="flex items-center gap-1"><Percent size={14}/> 消費税 10%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-black text-emerald-600 text-xl">¥{prd.price.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">販売価格 (税込)</div>
                    </div>
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