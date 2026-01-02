"use client";
import React from 'react';
import { Sale } from '@/types';
import { X, Clock, Tag, User } from 'lucide-react';

interface Props {
  customerName: string;
  history: Sale[];
  onClose: () => void;
}

export const CustomerHistoryModal = ({ customerName, history, onClose }: Props) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Customer Chart</p>
            <h3 className="text-2xl font-black text-slate-900 italic">{customerName} <span className="text-sm font-bold text-slate-400">様</span></h3>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-black italic tracking-widest">NO PREVIOUS VISITS</div>
          ) : (
            <div className="space-y-6">
              {history.map((item) => (
                <div key={item.id} className="relative pl-8 border-l-2 border-indigo-100 pb-2">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full" />
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase">
                      <Clock size={10} /> {new Date(item.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-black italic text-indigo-600">¥{item.total_amount.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-sm mb-1">
                      <Tag size={12} className="text-indigo-400" /> {item.menu_name}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                      <User size={10} /> Staff: {(item as any).staff?.name || 'Unknown'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all">
            Close Chart
          </button>
        </div>
      </div>
    </div>
  );
};