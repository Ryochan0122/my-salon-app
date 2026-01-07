"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Clock, MessageSquare, History, Phone, MapPin, Calendar, Check, Zap } from 'lucide-react';
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
    duration: 60 // ★ 追加: デフォルト所要時間
  });

  const [customerSuggestions, setCustomerSuggestions] = useState<any[]>([]);
  const [lastVisit, setLastVisit] = useState<any>(null);

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

  // ★ メニュー選択時に時間を自動セットする
  const handleMenuChange = (menuName: string) => {
    const selectedService = services.find(s => s.name === menuName);
    const duration = selectedService ? selectedService.duration_minutes : 60;
    
    setFormData(prev => ({
      ...prev,
      menu_name: menuName,
      duration: duration
    }));
  };

  useEffect(() => {
    if (formData.customer_name.length >= 1 && !formData.customer_id) {
      searchCustomers(formData.customer_name);
    } else {
      setCustomerSuggestions([]);
    }
  }, [formData.customer_name, formData.customer_id]);

  const searchCustomers = async (name: string) => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${name}%`)
      .limit(5);
    setCustomerSuggestions(data || []);
  };

  const selectCustomer = async (customer: any) => {
    setFormData(prev => ({
      ...prev,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_tel: customer.tel || '',
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
    const combinedStartTime = `${formData.date}T${formData.time}:00`;
    // page.tsx 側で終了時間を計算しやすいよう duration も渡す
    onConfirm({ ...formData, start_time: combinedStartTime });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 h-[90vh] flex flex-col md:flex-row border border-white/20">
        
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 z-50 p-3 bg-slate-100 hover:bg-red-50 hover:text-red-500 rounded-full transition-all group"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>

        <div className="flex-1 p-8 md:p-14 overflow-y-auto custom-scrollbar">
          <header className="mb-10">
            <h3 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">
              {initialData ? '予約の編集' : '新規予約'} <span className="text-indigo-600">.</span>
            </h3>
          </header>

          <div className="space-y-8">
            {/* お客様検索 */}
            <div className="relative">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">お客様名</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value, customer_id: ''})}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-none rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500 font-bold text-xl placeholder:text-slate-300 transition-all"
                  placeholder="お名前を入力..."
                />
              </div>

              {customerSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-3 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden ring-1 ring-black/5 animate-in slide-in-from-top-2">
                  {customerSuggestions.map(c => (
                    <button 
                      key={c.id} 
                      onClick={() => selectCustomer(c)}
                      className="w-full px-8 py-5 text-left hover:bg-indigo-50 flex items-center justify-between border-b border-slate-50 last:border-none transition-all"
                    >
                      <div>
                        <div className="font-black text-slate-900 text-lg">{c.name}</div>
                        <div className="text-xs text-slate-400 font-bold tracking-wider">{c.tel || '電話番号なし'}</div>
                      </div>
                      <div className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-full font-black text-[10px] uppercase flex items-center gap-1">
                        <Check size={12} /> 既存顧客を選択
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 新規顧客用入力フォーム */}
            {!formData.customer_id && formData.customer_name && (
              <div className="p-8 bg-indigo-50/40 rounded-[2.5rem] space-y-5 animate-in fade-in slide-in-from-top-2 border border-indigo-100/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">新規顧客プロファイル</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="tel" placeholder="電話番号" value={formData.customer_tel}
                      onChange={(e) => setFormData({...formData, customer_tel: e.target.value})}
                      className="w-full pl-11 pr-4 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                      value={formData.customer_gender}
                      onChange={(e) => setFormData({...formData, customer_gender: e.target.value})}
                      className="w-full pl-11 pr-4 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="female">女性</option>
                      <option value="male">男性</option>
                      <option value="other">その他</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                   <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="date" value={formData.customer_birth_date}
                      onChange={(e) => setFormData({...formData, customer_birth_date: e.target.value})}
                      className="w-full pl-11 pr-4 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm"
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      placeholder="住所" value={formData.customer_address}
                      onChange={(e) => setFormData({...formData, customer_address: e.target.value})}
                      className="w-full pl-11 pr-4 py-4 bg-white border-none rounded-2xl text-sm font-bold shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">担当スタッフ</label>
                <select 
                  value={formData.staff_id}
                  onChange={(e) => setFormData({...formData, staff_id: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">メニュー名</label>
                <div className="relative">
                  <select 
                    value={formData.menu_name}
                    onChange={(e) => handleMenuChange(e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  {/* 自動計算された時間のバッジ */}
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black animate-in fade-in zoom-in-90">
                    <Zap size={10} className="fill-current" /> {formData.duration}min
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">予約日</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">開始時間</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select 
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold appearance-none cursor-pointer"
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleConfirm}
            className="w-full mt-12 py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-100 active:scale-[0.97]"
          >
            {initialData ? '内容を更新する' : '予約を確定する'}
          </button>
        </div>

        {/* 右サイドバー：カルテ履歴 */}
        <div className="w-full md:w-96 bg-slate-50 p-10 flex flex-col border-l border-slate-100">
          <div className="flex items-center gap-2 mb-10">
            <div className="p-2 bg-indigo-500 rounded-xl text-white">
              <History size={20} />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">前回の施術履歴</span>
          </div>

          {lastVisit ? (
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-right-4">
              <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase rounded-lg mb-4 italic">
                {lastVisit.menu_name}
              </div>
              <p className="text-sm font-bold text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-4">
                "{lastVisit.memo || "この時の技術メモは登録されていません。"}"
              </p>
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">最終来店日</span>
                <span className="text-xs font-bold text-slate-400">{new Date(lastVisit.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare size={32} className="text-slate-300" />
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                新規のお客様、または<br/>過去の記録がありません。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};