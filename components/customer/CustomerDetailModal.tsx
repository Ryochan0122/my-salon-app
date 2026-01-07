"use client";
import React, { useEffect, useState } from 'react';
import { X, Calendar, Tag, MessageSquare, Phone, User, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Customer, Sale } from '@/types';

interface Props {
  customer: Customer;
  onClose: () => void;
}

export const CustomerDetailModal = ({ customer, onClose }: Props) => {
  const [history, setHistory] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('sales')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      setHistory(data || []);
      setLoading(false);
    };
    fetchHistory();
  }, [customer.id]);

  const totalSpent = history.reduce((sum, item) => sum + item.total_amount, 0);
  const lastVisit = history.length > 0 ? new Date(history[0].created_at) : null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-end p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      {/* スライドインするカルテ本体 */}
      <div className="relative bg-white w-full max-w-2xl h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* ヘッダーエリア：顧客の基本統計 */}
        <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
          
          <button onClick={onClose} className="absolute right-8 top-8 p-3 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <X size={24} />
          </button>

          <div className="relative z-10 flex items-end gap-6">
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-rose-500 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl uppercase">
              {customer.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/10">
                  {history.length >= 5 ? '👑 VIP会員' : 'レギュラー会員'}
                </span>
              </div>
              <h2 className="text-4xl font-black italic tracking-tighter mb-1">{customer.name} 様</h2>
              <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
                {customer.kana || 'カナデータなし'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-10 relative z-10">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">総来店回数</p>
              <p className="text-2xl font-black italic">{history.length}<span className="text-xs ml-1 opacity-40">回</span></p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">総利用金額</p>
              <p className="text-2xl font-black italic">¥{totalSpent.toLocaleString()}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">最終来店日</p>
              <p className="text-xs font-black italic mt-2">{lastVisit ? lastVisit.toLocaleDateString('ja-JP') : '---'}</p>
            </div>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10">
          
          {/* 基本情報 */}
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <User size={14} className="text-indigo-500" /> 顧客基本情報
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <Phone className="text-slate-300" size={18} />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">電話番号</p>
                  <p className="text-sm font-bold text-slate-700">{customer.tel || '未登録'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <Calendar className="text-slate-300" size={18} />
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">お誕生日</p>
                  <p className="text-sm font-bold text-slate-700">{customer.birth_date || '未登録'}</p>
                </div>
              </div>
            </div>
          </section>

          {/* 施術履歴タイムライン */}
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <Clock size={14} className="text-indigo-500" /> 施術履歴・カルテ記録
            </h3>
            
            {loading ? (
              <div className="py-10 text-center animate-pulse text-slate-300 font-black tracking-widest">データを読み込み中...</div>
            ) : history.length > 0 ? (
              <div className="space-y-8 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-px before:bg-slate-100">
                {history.map((record) => (
                  <div key={record.id} className="relative pl-12 group">
                    <div className="absolute left-0 top-1 w-10 h-10 bg-white border-4 border-slate-50 rounded-full flex items-center justify-center z-10 shadow-sm">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    </div>
                    <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all hover:-translate-y-1">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-tighter">
                          {new Date(record.created_at).toLocaleDateString('ja-JP')}
                        </span>
                        <span className="text-lg font-black text-slate-900 italic">¥{record.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <Tag size={12} className="text-indigo-500" />
                        <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{record.menu_name}</span>
                      </div>
                      <div className="bg-slate-50/80 p-5 rounded-2xl italic text-sm text-slate-500 leading-relaxed border border-slate-50">
                        <MessageSquare size={14} className="inline mr-2 opacity-30" />
                        {record.memo || 'この時のメモはありません'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <p className="text-slate-300 font-black uppercase tracking-widest text-xs">履歴データがありません</p>
              </div>
            )}
          </section>
        </div>

        {/* フッターアクション */}
        <div className="p-8 bg-white border-t border-slate-50 flex gap-4">
          <button className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 active:scale-95">
            顧客プロフィールの編集
          </button>
          <button 
            onClick={onClose}
            className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};