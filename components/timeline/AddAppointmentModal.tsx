"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Clock, MessageSquare, History, Phone, MapPin, Calendar, Check, Zap, Mail, Bell, BellOff, Info } from 'lucide-react';
import { Staff, Service, Appointment } from '@/types';
import { supabase } from '@/lib/supabase';

interface Props {
  staff: Staff[];
  services: Service[];
  initialData: Appointment | null;
  onClose: () => void;
  onConfirm: (data: any) => void | Promise<void>;
}

export const AddAppointmentModal = ({ staff, services, initialData, onClose, onConfirm }: Props) => {
  const initialDate = initialData ? new Date(initialData.start_time) : new Date();
  
  // フォームの状態管理
  const [formData, setFormData] = useState({
    customer_id: initialData?.customer_id || '', 
    customer_name: initialData?.customer_name || '',
    customer_tel: '',
    customer_email: '', 
    customer_gender: 'female',
    customer_birth_date: '',
    customer_address: '',
    notification_type: 'none', 
    staff_id: initialData?.staff_id || staff[0]?.id || '',
    menu_name: initialData?.menu_name || (services.length > 0 ? services[0].name : ''),
    date: initialDate.toISOString().split('T')[0],
    time: initialDate.toTimeString().slice(0, 5),
    duration: initialData?.duration || (services.length > 0 ? services[0].duration_minutes : 60)
  });

  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [lastVisit, setLastVisit] = useState<any>(null);

  // 時間の選択肢（15分刻み）
  const timeOptions = useMemo(() => {
    const options = [];
    for (let h = 9; h <= 21; h++) {
      for (let m = 0; m < 60; m += 15) {
        options.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return options;
  }, []);

  // メニュー変更時の連動（最新の services プロップスを参照）
  const handleMenuChange = (menuName: string) => {
    const selectedService = services.find(s => s.name === menuName);
    setFormData(prev => ({ 
      ...prev, 
      menu_name: menuName, 
      duration: selectedService ? selectedService.duration_minutes : 60 
    }));
  };

  // 顧客検索
  useEffect(() => {
    if (formData.customer_name.length >= 1 && !formData.customer_id) {
      const timer = setTimeout(() => searchCustomers(formData.customer_name), 300);
      return () => clearTimeout(timer);
    } else {
      setCustomerSuggestions([]);
    }
  }, [formData.customer_name, formData.customer_id]);

  const searchCustomers = async (name: string) => {
    const { data } = await supabase.from('customers').select('*').ilike('name', `%${name}%`).limit(5);
    setCustomerSuggestions(data || []);
  };

  const selectCustomer = async (customer: any) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_tel: customer.tel || '',
      customer_email: customer.email || '', 
      customer_gender: customer.gender || 'female',
      customer_birth_date: customer.birth_date || '',
      customer_address: customer.address || '',
    }));
    setCustomerSuggestions([]);
    
    const { data: lastSale } = await supabase
      .from('sales')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    setLastVisit(lastSale);
  };

  const handleConfirm = () => {
    // バリデーション：名前さえあればOK（住所・TEL等は任意）
    if (!formData.customer_name.trim()) {
      alert("お客様名を入力してください");
      return;
    }

    // 開始時間と終了時間の計算
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
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 h-[92vh] flex flex-col md:flex-row border border-white/20">
        
        <button onClick={onClose} className="absolute right-8 top-8 z-50 p-4 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-all group">
          <X size={24} className="group-hover:rotate-90 transition-transform" />
        </button>

        <div className="flex-1 p-8 md:p-14 overflow-y-auto custom-scrollbar">
          <header className="mb-12">
            <h3 className="text-5xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">
              {initialData ? 'Edit' : 'New'} <span className="text-indigo-600">Booking</span>
            </h3>
            <div className="flex items-center gap-2 mt-4 text-slate-400">
              <Info size={14} />
              <p className="text-[10px] font-black uppercase tracking-widest">
                名前以外の項目は空欄でも予約可能です
              </p>
            </div>
          </header>

          <div className="space-y-12">
            {/* 1. お客様情報 */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-500">
                <User size={18} />
                <label className="text-[11px] font-black uppercase tracking-[0.2em]">Customer Profile</label>
              </div>
              
              <div className="relative">
                <input 
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value, customer_id: ''})}
                  className="w-full px-8 py-6 bg-slate-50 border-none rounded-[2rem] font-black text-2xl focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 shadow-inner"
                  placeholder="お客様名 (必須)"
                />
                
                {customerSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-3 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-black/5">
                    {customerSuggestions.map(c => (
                      <button key={c.id} onClick={() => selectCustomer(c)} className="w-full px-8 py-5 text-left hover:bg-indigo-50 flex items-center justify-between border-b border-slate-50 last:border-none transition-all">
                        <div>
                          <div className="font-black text-slate-900 text-lg">{c.name}</div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{c.tel || 'No Phone Number'}</div>
                        </div>
                        <div className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full font-black text-[10px] uppercase">既存客を選択</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 任意入力エリア：名前が入力されている時だけ表示 */}
              {!formData.customer_id && formData.customer_name && (
                <div className="p-10 bg-indigo-50/40 rounded-[3rem] border border-indigo-100/50 space-y-6 animate-in slide-in-from-top-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <Phone className="absolute left-5 top-5 text-slate-400" size={18} />
                      <input type="tel" placeholder="電話番号 (任意)" value={formData.customer_tel} onChange={e => setFormData({...formData, customer_tel: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl font-bold shadow-sm" />
                    </div>
                    <div className="relative">
                      <User className="absolute left-5 top-5 text-slate-400" size={18} />
                      <select value={formData.customer_gender} onChange={e => setFormData({...formData, customer_gender: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl font-bold shadow-sm appearance-none">
                        <option value="female">女性</option>
                        <option value="male">男性</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <Calendar className="absolute left-5 top-5 text-slate-400" size={18} />
                      <input type="date" value={formData.customer_birth_date} onChange={e => setFormData({...formData, customer_birth_date: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl font-bold shadow-sm" />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-5 top-5 text-slate-400" size={18} />
                      <input placeholder="住所 (任意)" value={formData.customer_address} onChange={e => setFormData({...formData, customer_address: e.target.value})} className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl font-bold shadow-sm" />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* 2. 予約詳細 */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 text-indigo-500">
                <Clock size={18} />
                <label className="text-[11px] font-black uppercase tracking-[0.2em]">Appointment Details</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative">
                  <select 
                    value={formData.menu_name} 
                    onChange={(e) => handleMenuChange(e.target.value)} 
                    className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.5rem] font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    {services.length === 0 && <option value="">メニュー設定がありません</option>}
                  </select>
                  <div className="absolute right-12 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black flex items-center gap-1">
                    <Zap size={10} fill="currentColor" /> {formData.duration}min
                  </div>
                </div>
                <select value={formData.staff_id} onChange={(e) => setFormData({...formData, staff_id: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.5rem] font-bold appearance-none cursor-pointer">
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} (担当者)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.5rem] font-bold" />
                <select value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-none rounded-[1.5rem] font-bold appearance-none">
                  {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </section>

            {/* 3. 通知設定 */}
            <section className="p-10 bg-slate-900 rounded-[3.5rem] text-white space-y-8 shadow-2xl">
              <div className="flex items-center gap-3 text-indigo-400">
                <Bell size={18} />
                <label className="text-[11px] font-black uppercase tracking-[0.2em]">Reminder Settings</label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'none', label: 'なし', icon: <BellOff size={16}/> },
                  { id: 'email', label: 'Email', icon: <Mail size={16}/> },
                  { id: 'line', label: 'LINE', icon: <MessageSquare size={16}/> },
                ].map(type => (
                  <button
                    key={type.id} type="button"
                    onClick={() => setFormData({...formData, notification_type: type.id})}
                    className={`flex flex-col items-center gap-2 py-6 rounded-[2rem] font-black text-[10px] uppercase transition-all ${
                      formData.notification_type === type.id ? 'bg-indigo-600 shadow-lg' : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {type.icon}{type.label}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <button 
            onClick={handleConfirm}
            className="w-full mt-16 py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-3xl hover:bg-indigo-500 transition-all active:scale-95 shadow-[0_20px_50px_rgba(79,68,229,0.3)]"
          >
            {initialData ? 'Update Booking' : 'Confirm Reservation'}
          </button>
        </div>

        {/* 右サイドバー：カルテ履歴 */}
        <div className="w-full md:w-[32rem] bg-slate-50 p-12 flex flex-col border-l border-slate-100 overflow-y-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-2 bg-slate-900 rounded-xl text-white"><History size={20} /></div>
            <span className="text-[12px] font-black uppercase tracking-[0.2em] italic">Record History</span>
          </div>
          {lastVisit ? (
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-200/60 space-y-6">
              <div className="flex justify-between items-start">
                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-full italic">{lastVisit.menu_name}</span>
                <span className="text-[10px] font-black text-slate-300">{new Date(lastVisit.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-md font-bold text-slate-700 leading-relaxed italic border-l-4 border-indigo-100 pl-6">"{lastVisit.memo || "メモなし"}"</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center">
              <History size={64} className="mb-4" />
              <p className="text-[11px] font-black uppercase tracking-widest">No History Data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};