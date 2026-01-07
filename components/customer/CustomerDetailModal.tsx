"use client";
import React, { useEffect, useState } from 'react';
import { X, Calendar, Tag, MessageSquare, Phone, User, Clock, Save, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Customer, Sale } from '@/types';

interface Props {
  customer: Customer;
  onClose: () => void;
  // 更新後に親コンポーネントのデータを再取得するためのコールバック（任意）
  onUpdate?: () => void; 
}

export const CustomerDetailModal = ({ customer, onClose, onUpdate }: Props) => {
  const [history, setHistory] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 編集モードの切り替えフラグ
  const [isEditing, setIsEditing] = useState(false);
  // 編集用の入力値
  const [editedCustomer, setEditedCustomer] = useState<Customer>(customer);
  const [isSaving, setIsSaving] = useState(false);

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

  // 保存処理
  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('customers')
      .update({
        name: editedCustomer.name,
        kana: editedCustomer.kana,
        tel: editedCustomer.tel,
        birth_date: editedCustomer.birth_date,
      })
      .eq('id', customer.id);

    if (error) {
      alert('更新に失敗しました');
    } else {
      setIsEditing(false);
      if (onUpdate) onUpdate(); // 親のリストを更新
    }
    setIsSaving(false);
  };

  const totalSpent = history.reduce((sum, item) => sum + item.total_amount, 0);
  const lastVisit = history.length > 0 ? new Date(history[0].created_at) : null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-end p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* ヘッダーエリア */}
        <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
          
          <button onClick={onClose} className="absolute right-8 top-8 p-3 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
            <X size={24} />
          </button>

          <div className="relative z-10 flex items-end gap-6">
            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-rose-500 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-2xl uppercase">
              {editedCustomer.name[0]}
            </div>
            <div className="flex-1">
              <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-300 border border-white/10">
                {history.length >= 5 ? '👑 VIP会員' : 'レギュラー会員'}
              </span>
              
              {isEditing ? (
                <div className="mt-2 space-y-2">
                  <input
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-2xl w-full focus:outline-none focus:border-indigo-400"
                    value={editedCustomer.name}
                    onChange={(e) => setEditedCustomer({...editedCustomer, name: e.target.value})}
                  />
                  <input
                    className="bg-white/10 border border-white/20 rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-indigo-400"
                    value={editedCustomer.kana || ''}
                    placeholder="カナ"
                    onChange={(e) => setEditedCustomer({...editedCustomer, kana: e.target.value})}
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-4xl font-black italic tracking-tighter mb-1 mt-2">{editedCustomer.name} 様</h2>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">
                    {editedCustomer.kana || 'カナデータなし'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 統計グリッド（省略なし） */}
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
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
              <User size={14} className="text-indigo-500" /> 顧客基本情報
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <Phone className="text-slate-300" size={18} />
                <div className="flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">電話番号</p>
                  {isEditing ? (
                    <input
                      className="w-full bg-transparent border-b border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                      value={editedCustomer.tel || ''}
                      onChange={(e) => setEditedCustomer({...editedCustomer, tel: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-700">{editedCustomer.tel || '未登録'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                <Calendar className="text-slate-300" size={18} />
                <div className="flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">お誕生日</p>
                  {isEditing ? (
                    <input
                      type="date"
                      className="w-full bg-transparent border-b border-slate-200 text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500"
                      value={editedCustomer.birth_date || ''}
                      onChange={(e) => setEditedCustomer({...editedCustomer, birth_date: e.target.value})}
                    />
                  ) : (
                    <p className="text-sm font-bold text-slate-700">{editedCustomer.birth_date || '未登録'}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 施術履歴（読み取り専用） */}
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
              <Clock size={14} className="text-indigo-500" /> 施術履歴・カルテ記録
            </h3>
            {/* ...既存の履歴表示ロジック... */}
          </section>
        </div>

        {/* フッターアクション */}
        <div className="p-8 bg-white border-t border-slate-50 flex gap-4">
          {isEditing ? (
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-[2] py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Save size={16} /> {isSaving ? '保存中...' : '変更を保存する'}
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-2xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <Edit2 size={16} /> 顧客プロフィールの編集
            </button>
          )}
          
          <button 
            onClick={isEditing ? () => setIsEditing(false) : onClose}
            className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95"
          >
            {isEditing ? 'キャンセル' : '閉じる'}
          </button>
        </div>
      </div>
    </div>
  );
};