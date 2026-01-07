"use client";
import React, { useState, useEffect } from 'react';
import { supabase, getCurrentShopId } from '@/lib/supabase';
import { StickyNote, Send, Sparkles, MessageSquare, Clock } from 'lucide-react';

/**
 * スタッフ掲示板コンポーネント
 * 当日の共有事項をリアルタイムで同期
 */
export const StaffBulletin = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // メモの取得
  const fetchNotes = async () => {
    const shopId = await getCurrentShopId();
    if (!shopId) return;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('staff_notes')
      .select('*')
      .eq('shop_id', shopId)
      .eq('date', today)
      .order('created_at', { ascending: true });
    
    setNotes(data || []);
  };

  // リアルタイム購読の設定
  useEffect(() => {
    fetchNotes();

    // Supabase Realtimeでメモの更新を監視
    const channel = supabase
      .channel('staff_notes_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'staff_notes' 
      }, () => {
        fetchNotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePost = async () => {
    if (!input.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const shopId = await getCurrentShopId();
      if (!shopId) return;

      const { error } = await supabase.from('staff_notes').insert([
        { 
          shop_id: shopId,
          content: input, 
          date: new Date().toISOString().split('T')[0] 
        }
      ]);

      if (!error) {
        setInput('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 bg-slate-900 rounded-[3rem] p-8 shadow-2xl shadow-indigo-100/20 border border-slate-800 relative overflow-hidden group">
      {/* 背景の装飾的なグラデーション */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-1000" />
      
      <div className="flex items-center justify-between mb-6 px-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
            <MessageSquare size={18} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 block">Team Connect</span>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Staff Bulletin</h4>
          </div>
        </div>
        <div className="px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Live</span>
        </div>
      </div>
      
      {/* メッセージリスト */}
      <div className="space-y-4 mb-6 max-h-[280px] overflow-y-auto custom-scrollbar pr-2 relative z-10">
        {notes.length > 0 ? (
          notes.map((n, idx) => (
            <div 
              key={n.id} 
              className="bg-slate-800/50 backdrop-blur-sm p-5 rounded-[1.8rem] border border-slate-700/50 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-[11px] font-bold text-slate-200 leading-relaxed italic">
                  "{n.content}"
                </p>
                <div className="shrink-0 flex items-center gap-1.5 opacity-30">
                  <Clock size={10} className="text-slate-400" />
                  <span className="text-[8px] font-black text-slate-400">
                    {new Date(n.created_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center relative">
            <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <Sparkles size={20} className="text-slate-600" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">No updates for today</p>
          </div>
        )}
      </div>

      {/* 入力エリア */}
      <div className="relative z-10">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          placeholder="チームへの共有事項を入力..."
          disabled={isSubmitting}
          className="w-full bg-slate-800 border-2 border-transparent focus:border-indigo-500/50 rounded-[1.5rem] py-5 pl-6 pr-14 text-xs font-bold text-white placeholder:text-slate-500 shadow-inner transition-all outline-none"
        />
        <button 
          onClick={handlePost}
          disabled={isSubmitting || !input.trim()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-white hover:text-indigo-600 transition-all shadow-xl shadow-indigo-900/20 disabled:opacity-30 active:scale-90"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};