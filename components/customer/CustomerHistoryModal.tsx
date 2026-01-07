"use client";
import React from 'react';
import { Sale } from '@/types';
import { X, Clock, Tag, User, JapaneseYen, Receipt } from 'lucide-react';

interface Props {
  customerName: string;
  history: Sale[];
  onClose: () => void;
}

/**
 * 簡易的な来店履歴（タイムライン）を表示するモーダル
 */
export const CustomerHistoryModal = ({ customerName, history, onClose }: Props) => {
  // 総来店回数と総額の計算
  const totalVisits = history.length;
  const totalAmount = history.reduce((sum, item) => sum + item.total_amount, 0);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* 背景クリックで閉じる */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* ヘッダーセクション */}
        <div className="p-8 border-b border-slate-50 bg-slate-50/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Visit History</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">
                {customerName} <span className="text-sm font-bold text-slate-400 not-italic">様</span>
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 hover:bg-white text-slate-400 hover:text-slate-900 rounded-2xl transition-all shadow-sm hover:shadow-md"
            >
              <X size={24} />
            </button>
          </div>

          {/* 簡易統計チップ */}
          <div className="flex gap-3">
            <div className="flex-1 bg-white px-4 py-3 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase">Visits</span>
              <span className="text-sm font-black text-slate-900">{totalVisits}回</span>
            </div>
            <div className="flex-1 bg-white px-4 py-3 rounded-2xl border border-slate-100 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
              <span className="text-sm font-black text-indigo-600">¥{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 履歴リストセクション */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-white">
          {history.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <Receipt size={48} className="mb-4 opacity-20" />
              <p className="text-xs font-black italic tracking-widest uppercase">No Records Found</p>
            </div>
          ) : (
            <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-50">
              {history.map((item) => (
                <div key={item.id} className="relative pl-10 group">
                  {/* タイムラインのドット */}
                  <div className="absolute left-0 top-1.5 w-4 h-4 bg-white border-4 border-indigo-500 rounded-full z-10 group-hover:scale-125 transition-transform" />
                  
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 uppercase tracking-tighter">
                      <Clock size={12} className="text-indigo-400" /> 
                      {new Date(item.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </span>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black italic">
                      ¥{item.total_amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-all">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="mt-1">
                        <Tag size={14} className="text-indigo-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-900 leading-tight mb-1">{item.menu_name}</p>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-black uppercase tracking-widest">
                          <User size={10} /> 
                          <span>Staff: {(item as any).staff?.name || '不明'}</span>
                        </div>
                      </div>
                    </div>

                    {/* メモがあれば表示 */}
                    {item.memo && (
                      <div className="mt-3 pt-3 border-t border-slate-200/50">
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
                          "{item.memo}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* フッターセクション */}
        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose} 
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};