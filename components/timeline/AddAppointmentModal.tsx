"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Clock, MessageSquare, History, Phone, MapPin, Calendar, Check, Zap, Search } from 'lucide-react';
import { Staff, Service, Appointment } from '@/types';
import { supabase, getCurrentShopId } from '@/lib/supabase';

interface Props {
  staff: Staff[];
  services: Service[];
  initialData: Appointment | null;
  onClose: () => void;
  onConfirm: (data: any) => void | Promise<void>;
}

export const AddAppointmentModal = ({ staff, services, initialData, onClose, onConfirm }: Props) => {
  const initialDate = initialData ? new Date(initialData.start_time) : new Date();
  
  const [formData, setFormData] = useState({
    customer_id: '', 
    customer_name: initialData?.customer_name || '',
    customer_tel: '',
    customer_gender: 'female',
    customer_birth_date: '',
    customer_address: '',
    staff_id: initialData?.staff_id || staff[0]?.id || '',
    menu_name: initialData?.menu_name || services[0]?.name || '',
    date: initialDate.toISOString().split('T')[0],
    time: initialDate.toTimeString().slice(0, 5),
    duration: 60 
  });

  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [lastVisit, setLastVisit] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // 時間の選択肢 (9:00 - 21:00)
  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 9; h <= 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return options;
  }, []);

  const handleMenuChange = (menuName: string) => {
    const selectedService = services.find(s => s.name === menuName);
    const duration = selectedService ? selectedService.duration_minutes : 60;
    setFormData(prev => ({ ...prev, menu_name: menuName, duration: duration }));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.customer_name.length >= 1 && !formData.customer_id) {
        searchCustomers(formData.customer_name);
      } else {
        setCustomerSuggestions([]);
      }
    }, 300); // デバウンス処理
    return () => clearTimeout(timer);
  }, [formData.customer_name, formData.customer_id]);

  const searchCustomers = async (name: string) => {
    try {
      setIsSearching(true);
      const shopId = await getCurrentShopId();
      if (!shopId) return;

      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('shop_id', shopId) // 👈 自店舗の顧客のみ
        .ilike('name', `%${name}%`)
        .limit(5);
      
      setCustomerSuggestions(data || []);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCustomer = async (customer: any) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_tel: customer.tel || '',
    }));
    setCustomerSuggestions([]);

    // 前回の施術記録（salesテーブルから取得）
    const { data: lastSale } = await supabase
      .from('visual_history') // または sales テーブル
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    setLastVisit(lastSale);
  };

  const handleConfirm = async () => {
    const shopId = await getCurrentShopId();
    if (!shopId) return;

    const combinedStartTime = `${formData.date}T${formData.time}:00`;
    
    // shop_id を含めてデータを渡す
    onConfirm({ 
      ...formData, 
      shop_id: shopId, 
      start_time: combinedStartTime 
    });
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-6xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 h-[85vh] flex flex-col md:flex-row border border-white/20">
        
        <button 
          onClick={onClose}
          className="absolute right-8 top-8 z-50 p-4 bg-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all group"
        >
          <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* メイン入力エリア */}
        <div className="flex-1 p-8 md:p-16 overflow-y-auto custom-scrollbar">
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-8 bg-indigo-600 rounded-full" />
              <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em]">Reservation Entry</p>
            </div>
            <h3 className="text-5xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">
              {initialData ? 'Edit' : 'New'} Booking <span className="text-indigo-600">.</span>
            </h3>
          </header>

          <div className="space-y-10">
            {/* 顧客検索セクション */}
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2 mb-3 block">Customer Name</label>
              <div className="relative group">
                <Search className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${isSearching ? 'text-indigo-500 animate-pulse' : 'text-slate-300 group-focus-within:text-indigo-500'}`} size={22} />
                <input 
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value, customer_id: ''})}
                  className="w-full pl-16 pr-8 py-6 bg-slate-50 border-2 border-transparent focus:border-indigo-100 focus:bg-white rounded-[2.5rem] focus:ring-4 focus:ring-indigo-50/50 font-black text-2xl placeholder:text-slate-200 transition-all outline-none"
                  placeholder="名前を入力して検索..."
                />
              </div>

              {customerSuggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-4 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-black/5 animate-in slide-in-from-top-4">
                  {customerSuggestions.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => selectCustomer(c)}
                      className="w-full px-10 py-6 text-left hover:bg-indigo-50 flex items-center justify-between border-b border-slate-50 last:border-none transition-all group"
                    >
                      <div>
                        <div className="font-black text-slate-900 text-xl group-hover:text-indigo-600 transition-colors">{c.name} 様</div>
                        <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Tel: {c.tel || '---'}</div>
                      </div>
                      <div className="px-5 py-2 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase shadow-sm border border-indigo-100">
                        Select
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 新規顧客時の拡張フォーム */}
            {!formData.customer_id && formData.customer_name && (
              <div className="p-10 bg-indigo-50/30 rounded-[3.5rem] space-y-6 animate-in slide-in-from-top-4 border border-indigo-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <User size={120} />
                </div>
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Quick New Profile</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</span>
                    <input 
                      type="tel" value={formData.customer_tel}
                      onChange={(e) => setFormData({...formData, customer_tel: e.target.value})}
                      className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm"
                      placeholder="090-0000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</span>
                    <select 
                      value={formData.customer_gender}
                      onChange={(e) => setFormData({...formData, customer_gender: e.target.value})}
                      className="w-full px-6 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* スタッフ・メニュー選択 */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Assign Stylist</label>
                <select 
                  value={formData.staff_id}
                  onChange={(e) => setFormData({...formData, staff_id: e.target.value})}
                  className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl font-black text-slate-700 appearance-none cursor-pointer hover:bg-slate-100 transition-all shadow-inner"
                >
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Select Service</label>
                <div className="relative">
                  <select 
                    value={formData.menu_name}
                    onChange={(e) => handleMenuChange(e.target.value)}
                    className="w-full px-8 py-5 bg-slate-50 border-none rounded-3xl font-black text-slate-700 appearance-none cursor-pointer hover:bg-slate-100 transition-all shadow-inner"
                  >
                    {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black italic tracking-tighter">
                    <Zap size={10} className="text-indigo-400 fill-current" /> {formData.duration} MIN
                  </div>
                </div>
              </div>
            </div>

            {/* 日時選択 */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Select Date</label>
                <div className="relative group">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={20} />
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-3xl font-black text-slate-700 cursor-pointer shadow-inner"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Start Time</label>
                <div className="relative group">
                  <Clock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500" size={20} />
                  <select 
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full pl-16 pr-8 py-5 bg-slate-50 border-none rounded-3xl font-black text-slate-700 appearance-none cursor-pointer shadow-inner"
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleConfirm}
            className="w-full mt-16 py-8 bg-slate-900 text-white rounded-[3rem] font-black text-xl uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 active:scale-[0.98] flex items-center justify-center gap-3"
          >
            {initialData ? 'Update Schedule' : 'Confirm Reservation'}
            <Check size={24} />
          </button>
        </div>

        {/* 右サイドバー：インサイト */}
        <div className="w-full md:w-[400px] bg-slate-50 p-12 flex flex-col border-l border-slate-100 relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <History size={20} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block">Patient Records</span>
                <span className="text-sm font-black text-slate-900">カルテ履歴</span>
              </div>
            </div>

            {lastVisit ? (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                  <div className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-xl mb-6 italic tracking-widest">
                    {lastVisit.menu_name || 'Previous Menu'}
                  </div>
                  <p className="text-sm font-bold text-slate-600 leading-relaxed italic border-l-2 border-indigo-100 pl-6 mb-8">
                    "{lastVisit.note || "No technical notes registered for this session."}"
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest">Last Visit</span>
                    <span className="text-[11px] font-black text-slate-400">{new Date(lastVisit.created_at).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
                
                <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                  <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 -rotate-12" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Smart Insight</p>
                  <p className="text-xs font-bold leading-relaxed">
                    前回のカラーから45日が経過しています。根元のリタッチをご提案ください。
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
                <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6">
                  <MessageSquare size={36} className="text-slate-200" />
                </div>
                <p className="text-xs font-bold text-slate-400 leading-loose uppercase tracking-widest">
                  No records found.<br/>This might be a<br/>
                  <span className="text-indigo-500 font-black">new customer.</span>
                </p>
              </div>
            )}

            <div className="mt-auto pt-10">
              <div className="p-6 bg-slate-900/5 rounded-3xl border border-dashed border-slate-200">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Notice</p>
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                  予約を確定すると、担当スタッフのスケジュールに即時反映されます。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};