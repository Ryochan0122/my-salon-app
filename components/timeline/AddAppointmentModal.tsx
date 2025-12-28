"use client";
import React, { useState, useEffect } from 'react';
import { X, User, Scissors, Clock, MessageSquare, History } from 'lucide-react';
import { Staff, Service, Appointment, CustomerChart } from '@/types';
import { supabase } from '@/lib/supabase';

interface Props {
  staff: Staff[];
  services: Service[];
  initialData: Appointment | null;
  onClose: () => void;
  onConfirm: (data: any) => void;
}

export const AddAppointmentModal = ({ staff, services, initialData, onClose, onConfirm }: Props) => {
  const [formData, setFormData] = useState({
    customer_name: initialData?.customer_name || '',
    staff_id: initialData?.staff_id || staff[0]?.id || '',
    menu_name: initialData?.menu_name || services[0]?.name || '',
    start_time: initialData ? new Date(initialData.start_time).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  });

  // 顧客の過去メモ表示用
  const [customerHistory, setCustomerHistory] = useState<CustomerChart | null>(null);
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);

  // 名前が入力されるたびにサジェストと履歴を検索
  useEffect(() => {
    if (formData.customer_name.length >= 1) {
      searchCustomerData(formData.customer_name);
    } else {
      setCustomerHistory(null);
      setNameSuggestions([]);
    }
  }, [formData.customer_name]);

  const searchCustomerData = async (name: string) => {
    // 1. 過去のカルテから最新のメモを取得
    const { data: chartData } = await supabase
      .from('customer_charts')
      .select('*')
      .eq('customer_name', name)
      .order('created_at', { ascending: false })
      .limit(1);

    if (chartData && chartData.length > 0) {
      setCustomerHistory(chartData[0]);
    } else {
      setCustomerHistory(null);
    }

    // 2. 名前のサジェスト用（重複を除外して取得）
    const { data: appData } = await supabase
      .from('appointments')
      .select('customer_name')
      .ilike('customer_name', `%${name}%`)
      .limit(5);
    
    if (appData) {
      const names = Array.from(new Set(appData.map(a => a.customer_name)));
      setNameSuggestions(names);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex">
          {/* 左側：入力フォーム */}
          <div className="flex-1 p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black italic text-slate-900 tracking-tighter">
                {initialData ? 'EDIT' : 'NEW'} BOOKING
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
            </div>

            <div className="space-y-6">
              {/* 名前入力 & サジェスト */}
              <div className="relative">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                    placeholder="お客様名"
                  />
                </div>
                {/* サジェストリスト */}
                {nameSuggestions.length > 0 && formData.customer_name !== nameSuggestions[0] && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    {nameSuggestions.map(name => (
                      <button 
                        key={name}
                        onClick={() => setFormData({...formData, customer_name: name})}
                        className="w-full px-6 py-3 text-left hover:bg-slate-50 font-bold text-slate-600 transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Stylist</label>
                  <select 
                    value={formData.staff_id}
                    onChange={(e) => setFormData({...formData, staff_id: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"
                  >
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Menu</label>
                  <select 
                    value={formData.menu_name}
                    onChange={(e) => setFormData({...formData, menu_name: e.target.value})}
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold appearance-none"
                  >
                    {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-2 block">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={() => onConfirm(formData)}
              className="w-full mt-10 py-5 bg-slate-900 text-white rounded-3xl font-black text-lg hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
            >
              {initialData ? '変更を保存する' : '予約を確定する'}
            </button>
          </div>

          {/* 右側：顧客履歴プレビュー */}
          <div className="w-64 bg-slate-50 p-10 border-l border-slate-100 hidden md:block">
            <div className="flex items-center gap-2 mb-6 text-slate-400">
              <History size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Customer History</span>
            </div>

            {customerHistory ? (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-300 uppercase block mb-2">Last Visit Memo</label>
                  <div className="bg-white p-4 rounded-2xl text-xs font-bold text-slate-600 leading-relaxed shadow-sm">
                    {customerHistory.memo || "メモはありません"}
                  </div>
                </div>
                {customerHistory.image_url && (
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase block mb-2">Reference Style</label>
                    <img 
                      src={customerHistory.image_url} 
                      className="w-full aspect-square object-cover rounded-2xl shadow-sm"
                      alt="Last style" 
                    />
                  </div>
                )}
                <div className="text-[10px] font-black text-indigo-400 italic">
                  Last visit: {new Date(customerHistory.created_at).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <MessageSquare size={48} className="mb-4 text-slate-300" />
                <p className="text-[10px] font-black text-slate-400 uppercase leading-tight">No past records for this name</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};