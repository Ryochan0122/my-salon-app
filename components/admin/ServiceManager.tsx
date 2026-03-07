"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Staff, Service } from '@/types';
import { 
  UserPlus, Scissors, Trash2, Plus, 
  Clock, Info, ShoppingBag, Barcode, Package,
  ArrowUpCircle, ArrowDownCircle, Loader2, X, Check, CalendarOff
} from 'lucide-react';

interface ServiceManagerProps {
  services: Service[];
  onRefresh: () => Promise<void>;
}

const InlineForm = ({ fields, onSubmit, onCancel }: {
  fields: { key: string; label: string; placeholder: string; type?: string; defaultValue?: string }[];
  onSubmit: (values: Record<string, string>) => void;
  onCancel: () => void;
}) => {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map(f => [f.key, f.defaultValue || '']))
  );

  return (
    <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 animate-in slide-in-from-top-4 duration-300 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1 mb-1 block">{f.label}</label>
            <input
              type={f.type || 'text'}
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="w-full px-5 py-4 bg-white rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 border border-indigo-100"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onSubmit(values)}
          className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Check size={16} /> 登録する
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-4 bg-white text-slate-400 rounded-2xl font-black text-xs border border-slate-100 hover:bg-slate-50 transition-all"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export const ServiceManager = ({ services: initialServices, onRefresh }: ServiceManagerProps) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'services' | 'products' | 'holidays'>('staff');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // 公休フォーム用
  const [holidayStaffId, setHolidayStaffId] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  const getShopId = () => localStorage.getItem('aura_shop_id');

  const fetchStaff = useCallback(async () => {
    const shopId = getShopId();
    if (!shopId) return;
    const { data } = await supabase.from('staff').select('*').eq('shop_id', shopId).order('created_at', { ascending: true });
    setStaff(data || []);
  }, []);

  const fetchProducts = useCallback(async () => {
    const shopId = getShopId();
    if (!shopId) return;
    const { data } = await supabase.from('inventory').select('*').eq('shop_id', shopId).eq('category', 'product').order('name', { ascending: true });
    setProducts(data || []);
  }, []);

  const fetchHolidays = useCallback(async () => {
    const shopId = getShopId();
    if (!shopId) return;
    const { data } = await supabase
      .from('staff_schedules')
      .select('*, staff(name)')
      .eq('shop_id', shopId)
      .eq('is_holiday', true)
      .order('date', { ascending: true });
    setHolidays(data || []);
  }, []);

  useEffect(() => {
    const loadTabData = async () => {
      setLoading(true);
      setShowForm(false);
      if (activeTab === 'staff') await fetchStaff();
      if (activeTab === 'products') await fetchProducts();
      if (activeTab === 'holidays') { await fetchStaff(); await fetchHolidays(); }
      setLoading(false);
    };
    loadTabData();
  }, [activeTab, fetchStaff, fetchProducts, fetchHolidays]);

  const handleActionComplete = async () => {
    setShowForm(false);
    if (activeTab === 'staff') await fetchStaff();
    if (activeTab === 'products') await fetchProducts();
    if (activeTab === 'holidays') await fetchHolidays();
    await onRefresh();
  };

  const addStaff = async (values: Record<string, string>) => {
    const shopId = getShopId();
    if (!shopId) return alert('店舗情報が取得できません');
    const { error } = await supabase.from('staff').insert([{ 
      name: values.name, 
      role: values.role || 'スタイリスト',
      shop_id: shopId
    }]);
    if (error) return alert('登録失敗: ' + error.message);
    handleActionComplete();
  };

  const addService = async (values: Record<string, string>) => {
    const shopId = getShopId();
    if (!shopId) return alert('店舗情報が取得できません');
    const { error } = await supabase.from('services').insert([{ 
      name: values.name,
      price: parseInt(values.price) || 0,
      duration_minutes: parseInt(values.duration) || 60,
      shop_id: shopId
    }]);
    if (error) return alert('登録失敗: ' + error.message);
    handleActionComplete();
  };

  const addProduct = async (values: Record<string, string>) => {
    const shopId = getShopId();
    if (!shopId) return alert('店舗情報が取得できません');
    const { error } = await supabase.from('inventory').insert([{
      name: values.name,
      price: parseInt(values.price) || 0,
      stock: parseInt(values.stock) || 0,
      category: 'product',
      shop_id: shopId
    }]);
    if (error) return alert('登録失敗: ' + error.message);
    handleActionComplete();
  };

  const addHoliday = async () => {
    const shopId = getShopId();
    if (!shopId || !holidayStaffId || !holidayDate) return alert('スタッフと日付を選択してください');
    const { error } = await supabase.from('staff_schedules').upsert([{
      shop_id: shopId,
      staff_id: holidayStaffId,
      date: holidayDate,
      is_holiday: true
    }], { onConflict: 'shop_id,staff_id,date' });
    if (error) return alert('登録失敗: ' + error.message);
    setHolidayStaffId('');
    setHolidayDate('');
    setShowForm(false);
    await fetchHolidays();
  };

  const adjustStock = async (id: string, currentStock: number, amount: number) => {
    const newStock = Math.max(0, currentStock + amount);
    const { error } = await supabase.from('inventory').update({ stock: newStock }).eq('id', id);
    if (!error) handleActionComplete();
  };

  const deleteItem = async (table: string, id: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) handleActionComplete();
  };

  const staffFields = [
    { key: 'name', label: 'スタッフ名', placeholder: '例：田中 さくら' },
    { key: 'role', label: '役職', placeholder: 'スタイリスト', defaultValue: 'スタイリスト' },
  ];

  const serviceFields = [
    { key: 'name', label: 'メニュー名', placeholder: '例：カット＋シャンプー' },
    { key: 'price', label: '料金（税込）', placeholder: '5500', type: 'number' },
    { key: 'duration', label: '所要時間（分）', placeholder: '60', type: 'number', defaultValue: '60' },
  ];

  const productFields = [
    { key: 'name', label: '商品名', placeholder: '例：AURAシャンプー' },
    { key: 'price', label: '販売価格（税込）', placeholder: '3300', type: 'number' },
    { key: 'stock', label: '初期在庫数', placeholder: '0', type: 'number', defaultValue: '0' },
  ];

  const handleSubmit = (values: Record<string, string>) => {
    if (activeTab === 'staff') addStaff(values);
    else if (activeTab === 'services') addService(values);
    else addProduct(values);
  };

  const currentFields = activeTab === 'staff' ? staffFields : activeTab === 'services' ? serviceFields : productFields;

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-700">
      <div className="mb-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-6 flex items-start gap-4">
        <div className="bg-indigo-600 text-white p-2 rounded-xl"><Info size={20} /></div>
        <div>
          <h4 className="font-black text-indigo-900 text-sm italic uppercase tracking-tighter">System Advice</h4>
          <p className="text-indigo-700/80 text-[11px] font-bold mt-1">
            在庫は入荷ボタンで調整してください。会計時に自動で減算されます。公休設定したスタッフはタイムラインでOFF表示されます。
          </p>
        </div>
      </div>

      <div className="flex gap-4 mb-10 bg-slate-50 p-2 rounded-[2.5rem] w-fit border border-slate-100">
        {[
          { id: 'staff', label: 'スタッフ', icon: UserPlus },
          { id: 'services', label: 'メニュー', icon: Scissors },
          { id: 'products', label: '在庫/商品', icon: ShoppingBag },
          { id: 'holidays', label: '公休設定', icon: CalendarOff },
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
            onClick={() => setShowForm(v => !v)}
            className="px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black flex items-center gap-3 hover:bg-slate-900 transition-all shadow-xl active:scale-95"
          >
            <Plus size={24} /> <span className="uppercase text-sm">Add New</span>
          </button>
        </div>

        <div className="p-12 space-y-6">
          {/* 公休追加フォーム */}
          {showForm && activeTab === 'holidays' && (
            <div className="p-8 bg-indigo-50 rounded-[2.5rem] border-2 border-indigo-100 animate-in slide-in-from-top-4 duration-300 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1 mb-1 block">スタッフ</label>
                  <select
                    value={holidayStaffId}
                    onChange={e => setHolidayStaffId(e.target.value)}
                    className="w-full px-5 py-4 bg-white rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 border border-indigo-100"
                  >
                    <option value="">選択してください</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1 mb-1 block">日付</label>
                  <input
                    type="date"
                    value={holidayDate}
                    onChange={e => setHolidayDate(e.target.value)}
                    className="w-full px-5 py-4 bg-white rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 border border-indigo-100"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={addHoliday}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  <Check size={16} /> 公休を登録する
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-6 py-4 bg-white text-slate-400 rounded-2xl font-black text-xs border border-slate-100 hover:bg-slate-50 transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 他タブのフォーム */}
          {showForm && activeTab !== 'holidays' && (
            <InlineForm
              fields={currentFields}
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
            />
          )}

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
              <p className="font-black text-slate-300 uppercase text-[10px] tracking-widest">Syncing Data...</p>
            </div>
          ) : (
            <div className="space-y-6">
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
              {activeTab === 'staff' && staff.length === 0 && !loading && (
                <div className="py-16 text-center text-slate-300">
                  <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-black uppercase text-[10px] tracking-widest">Add Newからスタッフを登録してください</p>
                </div>
              )}

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
              {activeTab === 'services' && initialServices.length === 0 && !loading && (
                <div className="py-16 text-center text-slate-300">
                  <Scissors size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-black uppercase text-[10px] tracking-widest">Add Newからメニューを登録してください</p>
                </div>
              )}

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
              {activeTab === 'products' && products.length === 0 && !loading && (
                <div className="py-16 text-center text-slate-300">
                  <Package size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-black uppercase text-[10px] tracking-widest">Add Newから商品を登録してください</p>
                </div>
              )}

              {activeTab === 'holidays' && (
                <>
                  {holidays.length === 0 && !loading && (
                    <div className="py-16 text-center text-slate-300">
                      <CalendarOff size={48} className="mx-auto mb-4 opacity-20" />
                      <p className="font-black uppercase text-[10px] tracking-widest">公休が登録されていません</p>
                    </div>
                  )}
                  {holidays.map((h) => (
                    <div key={h.id} className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:bg-white transition-all shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center font-black text-2xl">
                          <CalendarOff size={28} />
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-xl">{h.staff?.name}</div>
                          <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mt-1">
                            {new Date(h.date + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })} — OFF
                          </div>
                        </div>
                      </div>
                      <button onClick={() => deleteItem('staff_schedules', h.id)} className="p-4 text-slate-200 hover:text-rose-500 transition-all"><Trash2 size={24}/></button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};