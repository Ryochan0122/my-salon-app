"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, User, Clock, MessageSquare, History, Phone, 
  Calendar, Check, Zap, Sparkles, Scissors, Search
} from 'lucide-react';
import { Staff, Service, Appointment } from '@/types';
import { supabase } from '@/lib/supabase';

interface Props {
  staff: Staff[];
  services: Service[];
  initialData: Appointment | null;
  onClose: () => void;
  onConfirm: (data: any) => void | Promise<void>;
  // 空きスロットクリック時の初期値（編集とは別扱い）
  defaultStaffId?: string;
  defaultDate?: string;
  defaultTime?: string;
}

export const AddAppointmentModal = ({ 
  staff, services, initialData, onClose, onConfirm,
  defaultStaffId, defaultDate, defaultTime
}: Props) => {
  const initialDate = initialData 
    ? new Date(initialData.start_time) 
    : defaultDate 
      ? new Date(defaultDate) 
      : new Date();

  const [formData, setFormData] = useState({
    customer_id: initialData?.customer_id || '', 
    customer_name: initialData?.customer_name || '',
    customer_tel: '',
    customer_email: '', 
    customer_gender: 'female',
    customer_birth_date: '',
    customer_address: '',
    notification_type: 'none', 
    staff_id: initialData?.staff_id || defaultStaffId || staff[0]?.id || '',
    menu_name: initialData?.menu_name || (services.length > 0 ? services[0].name : ''),
    date: defaultDate || initialDate.toISOString().split('T')[0],
    time: defaultTime || initialDate.toTimeString().slice(0, 5),
    duration: initialData?.duration || (services.length > 0 ? services[0].duration_minutes : 60),
    memo: initialData?.memo || ''
  });

  // 以下は全て元のコードのまま変更なし

  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [lastVisit, setLastVisit] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  // 時間の選択肢を生成 (09:00 - 21:45)
  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 9; h <= 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return options;
  }, []);

  // メニュー変更時に所要時間を連動
  const handleMenuChange = (menuName: string) => {
    const selectedService = services.find(s => s.name === menuName);
    setFormData(prev => ({ 
      ...prev, 
      menu_name: menuName, 
      duration: selectedService ? selectedService.duration_minutes : 60 
    }));
  };

  // 顧客検索ロジック
  useEffect(() => {
    if (formData.customer_name.length >= 1 && !formData.customer_id) {
      setIsSearching(true);
      const timer = setTimeout(() => searchCustomers(formData.customer_name), 300);
      return () => clearTimeout(timer);
    } else {
      setCustomerSuggestions([]);
      setIsSearching(false);
    }
  }, [formData.customer_name, formData.customer_id]);

  const searchCustomers = async (name: string) => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${name}%`)
      .limit(5);
    setCustomerSuggestions(data || []);
    setIsSearching(false);
  };

  // 顧客選択時の「いつものですね」発動ロジック
  const selectCustomer = async (customer: any) => {
    const { data: lastSale } = await supabase
      .from('sales')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_tel: customer.tel || '',
      customer_email: customer.email || '', 
      customer_gender: customer.gender || 'female',
      customer_birth_date: customer.birth_date || '',
      customer_address: customer.address || '',
      menu_name: lastSale?.menu_name || prev.menu_name
    }));
    setCustomerSuggestions([]);
    setLastVisit(lastSale);
  };

  const handleConfirm = () => {
    if (!formData.customer_name.trim()) {
      alert("お客様名を入力してください");
      return;
    }
    const start = new Date(`${formData.date}T${formData.time}:00`);
    const end = new Date(start.getTime() + formData.duration * 60000);
    
    onConfirm({ 
      ...formData, 
      start_time: start.toISOString(), 
      end_time: end.toISOString() 
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* 背景の超強力ブラー */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-6xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 h-[92vh] flex flex-col md:flex-row border border-white/20">
        
        {/* 閉じるボタン */}
        <button onClick={onClose} className="absolute right-8 top-8 z-50 p-4 bg-slate-100 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all group shadow-sm">
          <X size={24} className="group-hover:rotate-90 transition-transform" />
        </button>

        {/* 左側：入力フォームメイン */}
        <div className="flex-1 p-8 md:p-16 overflow-y-auto custom-scrollbar bg-white">
          <header className="mb-14">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-1 border-t-4 border-indigo-600 rounded-full" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600">Reservation Desk</p>
            </div>
            <h3 className="text-6xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">
              {initialData ? 'Update' : 'New'} <span className="text-indigo-600 underline decoration-indigo-100 underline-offset-8">Booking</span>
            </h3>
            <div className="flex items-center gap-2 mt-6 text-slate-400">
              <Sparkles size={16} className="text-indigo-400 animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-widest italic">
                Smart suggestion active: Type name to auto-fill history.
              </p>
            </div>
          </header>

          <div className="space-y-14">
            {/* 1. CUSTOMER PROFILE */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-slate-900 text-white rounded-lg"><User size={16} /></div>
                <label className="text-xs font-black uppercase tracking-[0.2em]">Customer Profile</label>
              </div>
              
              <div className="relative">
                <input 
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value, customer_id: ''})}
                  className="w-full px-10 py-8 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-[2.5rem] font-black text-3xl transition-all placeholder:text-slate-200 shadow-inner outline-none"
                  placeholder="お客様名を入力..."
                />
                {isSearching && <div className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-indigo-500"><Search size={24} /></div>}
                
                {customerSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-4 bg-white rounded-[2.5rem] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden ring-1 ring-black/5 animate-in slide-in-from-top-4">
                    {customerSuggestions.map(c => (
                      <button key={c.id} onClick={() => selectCustomer(c)} className="w-full px-10 py-6 text-left hover:bg-indigo-50 flex items-center justify-between border-b border-slate-50 last:border-none transition-all group">
                        <div>
                          <div className="font-black text-slate-900 text-xl group-hover:text-indigo-600 transition-colors">{c.name}</div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{c.tel || 'No phone'}</div>
                        </div>
                        <div className="px-6 py-3 bg-indigo-100 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">Select & Sync</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!formData.customer_id && formData.customer_name && (
                <div className="p-8 bg-indigo-50/30 rounded-[3rem] border border-indigo-100/50 grid grid-cols-2 gap-6 animate-in fade-in zoom-in-95">
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input type="tel" placeholder="Phone (Optional)" value={formData.customer_tel} onChange={e => setFormData({...formData, customer_tel: e.target.value})} className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-[1.5rem] text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  </div>
                  <select value={formData.customer_gender} onChange={e => setFormData({...formData, customer_gender: e.target.value})} className="w-full px-8 py-5 bg-white border-none rounded-[1.5rem] text-sm font-bold shadow-sm outline-none appearance-none cursor-pointer">
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
              )}
            </section>

            {/* 2. SERVICE SELECTION */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 text-slate-900">
                <div className="p-2 bg-slate-900 text-white rounded-lg"><Scissors size={16} /></div>
                <label className="text-xs font-black uppercase tracking-[0.2em]">Service Details</label>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {services.slice(0, 6).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleMenuChange(s.name)}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
                      formData.menu_name === s.name 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <select 
                    value={formData.menu_name} 
                    onChange={(e) => handleMenuChange(e.target.value)} 
                    className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2rem] font-black text-lg appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10"
                  >
                    {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black flex items-center gap-2">
                    <Clock size={12} /> {formData.duration}min
                  </div>
                </div>
                <select value={formData.staff_id} onChange={(e) => setFormData({...formData, staff_id: e.target.value})} className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2rem] font-black text-lg appearance-none cursor-pointer">
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} (Stylist)</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2rem] font-black text-lg outline-none focus:ring-4 focus:ring-indigo-500/10" />
                <select value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2rem] font-black text-lg appearance-none outline-none focus:ring-4 focus:ring-indigo-500/10">
                  {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </section>
          </div>

          <button 
            onClick={handleConfirm}
            className="w-full mt-20 py-10 bg-slate-900 text-white rounded-[3rem] font-black text-3xl hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-2xl flex items-center justify-center gap-6 group"
          >
            {initialData ? 'Update Schedule' : 'Complete Booking'}
            <Check size={32} className="group-hover:scale-125 transition-transform" />
          </button>
        </div>

        {/* 右側：RECORD SIDEBAR */}
        <div className="w-full md:w-[35rem] bg-slate-50 p-12 md:p-16 flex flex-col border-l border-slate-100 overflow-y-auto">
          <div className="flex items-center gap-4 mb-16">
            <div className="p-4 bg-white rounded-3xl shadow-sm text-indigo-600"><History size={28} /></div>
            <div>
              <span className="text-sm font-black uppercase tracking-[0.3em] italic block">Intelligence</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History & AI Insights</span>
            </div>
          </div>

          {lastVisit ? (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-700">
              <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[5rem] -mr-10 -mt-10 transition-all group-hover:scale-110" />
                <div className="flex justify-between items-start relative z-10 mb-8">
                  <span className="px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-indigo-100">
                    {lastVisit.menu_name}
                  </span>
                  <span className="text-xs font-black text-slate-300 bg-slate-50 px-4 py-2 rounded-full italic">
                    {new Date(lastVisit.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="relative z-10">
                  <p className="text-lg font-bold text-slate-800 leading-relaxed italic border-l-4 border-indigo-500 pl-8 py-2">
                    "{lastVisit.memo || "No special notes recorded for this visit."}"
                  </p>
                </div>
                <div className="pt-8 flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] relative z-10">
                  <Zap size={12} className="fill-current" /> AI Summary of last session
                </div>
              </div>

              {/* 追加：クイックノートエリア */}
              <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white/90 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 text-indigo-400">
                  <MessageSquare size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Quick Tip</span>
                </div>
                <p className="text-xs font-medium leading-loose italic opacity-80">
                  前回のメニューが自動セットされました。このまま確定ボタンを押すだけで、常連様の「いつもの」予約が完了します。
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20">
              <History size={100} strokeWidth={1} className="mb-8" />
              <p className="text-sm font-black uppercase tracking-[0.4em] leading-loose">
                Scanning Database...<br/>New Client Insight
              </p>
            </div>
          )}

          <div className="mt-auto pt-12 flex justify-center">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
              Aura <span className="text-indigo-300">/</span> Management <span className="text-indigo-300">/</span> OS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};