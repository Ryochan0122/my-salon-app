"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Send, MessageCircle, Megaphone, Heart, 
  User, Clock, Zap, Smile, Coffee, PartyPopper, X
} from 'lucide-react';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface Props {
  staffs: any[];
}

export const StaffBulletin = ({ staffs }: Props) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'memo' | 'system'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. 初回データ取得 & リアルタイム購読
  useEffect(() => {
    fetchMessages();
    
    // 型エラーを回避するために 'postgres_changes' チャンネルを正しく設定
    const channel = supabase
      .channel('bulletin-realtime')
      .on(
        'postgres_changes', 
        { 
          event: 'INSERT', 
          table: 'bulletin_messages',
          schema: 'public' 
        }, 
        (payload: RealtimePostgresInsertPayload<any>) => {
          setMessages(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('bulletin_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setMessages(data || []);
  };

  // 2. メッセージ送信
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const shopId = localStorage.getItem('aura_shop_id');
    // 暫定的にスタッフIDを特定（Auth実装後はsessionから取得）
    const staffId = staffs[0]?.id;

    const { error } = await supabase.from('bulletin_messages').insert([{
      shop_id: shopId,
      staff_id: staffId,
      content: newMessage,
      type: 'memo'
    }]);

    if (error) {
      alert("送信に失敗しました");
    } else {
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-[85vh] gap-6 animate-in fade-in slide-in-from-right-4 duration-700 bg-slate-50/50 p-4 rounded-[3rem]">
      
      {/* HEADER: タイトルとフィルター */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Live Feed</span>
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">
            Team <span className="text-indigo-600">Bulletin</span>
          </h2>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl gap-1 shadow-sm border border-slate-100">
          {[
            { id: 'all', label: 'ALL', icon: MessageCircle },
            { id: 'memo', label: 'MEMO', icon: Smile },
            { id: 'system', label: 'SYSTEM', icon: Zap },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black flex items-center gap-2 transition-all ${
                activeTab === tab.id 
                ? 'bg-slate-900 text-white shadow-lg' 
                : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={12} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* MAIN: タイムライン */}
        <div className="flex-1 bg-white rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar" ref={scrollRef}>
            {messages
              .filter(m => activeTab === 'all' || m.type === activeTab)
              .map((msg) => {
                const staff = staffs.find(s => s.id === msg.staff_id);
                const isSystem = msg.type === 'system';

                return (
                  <div key={msg.id} className={`flex gap-4 ${isSystem ? 'justify-center' : ''} animate-in slide-in-from-bottom-2`}>
                    {!isSystem && (
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex-shrink-0 flex items-center justify-center font-black italic text-indigo-600 text-sm border border-indigo-100">
                        {staff?.name?.[0] || 'A'}
                      </div>
                    )}
                    
                    <div className={`max-w-[80%] ${isSystem ? 'w-full' : ''}`}>
                      {!isSystem && (
                        <div className="flex items-center gap-2 mb-1.5 ml-1">
                          <span className="text-[10px] font-black text-slate-900">{staff?.name}</span>
                          <span className="text-[8px] font-bold text-slate-300">
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      )}
                      
                      <div className={`p-5 rounded-[1.8rem] ${
                        isSystem 
                        ? 'bg-indigo-600 text-white text-center flex items-center justify-center gap-3 shadow-xl shadow-indigo-100' 
                        : 'bg-slate-50 border border-slate-100'
                      }`}>
                        {isSystem && <PartyPopper size={16} />}
                        <p className={`text-xs font-bold leading-relaxed ${isSystem ? 'text-white' : 'text-slate-700'}`}>
                          {msg.content}
                        </p>
                        {isSystem && <PartyPopper size={16} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <MessageCircle size={48} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-widest mt-4">No messages yet</p>
              </div>
            )}
          </div>

          {/* INPUT AREA */}
          <div className="p-6 bg-white border-t border-slate-50">
            <form onSubmit={sendMessage} className="relative">
              <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Share with team..."
                className="w-full pl-6 pr-16 py-4 bg-slate-50 border-2 border-transparent rounded-[2rem] text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-slate-900 transition-all shadow-lg active:scale-95"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* SIDEBAR: ステータス */}
        <div className="w-72 hidden lg:flex flex-col gap-6">
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <Megaphone className="absolute -right-4 -top-4 w-24 h-24 text-white/10 -rotate-12 group-hover:scale-110 transition-transform" />
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Today's Focus</h4>
            <p className="text-sm font-black leading-tight italic relative z-10">
              "夕方の予約が混み合っています。クロス交換のサポートをお願いします！"
            </p>
          </div>

          <div className="bg-white rounded-[3rem] p-8 border border-slate-100 flex-1 flex flex-col shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Staff Status</h4>
            <div className="space-y-4 overflow-y-auto custom-scrollbar">
              {staffs.map(staff => (
                <div key={staff.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs italic border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {staff.name[0]}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900">{staff.name}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Available</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};