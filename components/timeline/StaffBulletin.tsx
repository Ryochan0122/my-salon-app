"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { StickyNote, Send, Sparkles } from 'lucide-react';

export const StaffBulletin = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [input, setInput] = useState('');

  const fetchNotes = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('staff_notes')
      .select('*')
      .eq('date', today)
      .order('created_at', { ascending: true });
    setNotes(data || []);
  };

  useEffect(() => { fetchNotes(); }, []);

  const handlePost = async () => {
    if (!input.trim()) return;
    const { error } = await supabase.from('staff_notes').insert([
      { content: input, date: new Date().toISOString().split('T')[0] }
    ]);
    if (!error) {
      setInput('');
      fetchNotes();
    }
  };

  return (
    <div className="mt-6 bg-indigo-50/50 rounded-[2.5rem] p-6 border border-indigo-100 shadow-sm">
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className="p-1.5 bg-indigo-500 rounded-lg text-white">
          <StickyNote size={14} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-900">Today's Bulletin</span>
      </div>
      
      <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
        {notes.length > 0 ? notes.map(n => (
          <div key={n.id} className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50 animate-in fade-in slide-in-from-bottom-2">
            <p className="text-[11px] font-bold text-slate-700 leading-relaxed">{n.content}</p>
          </div>
        )) : (
          <div className="py-8 text-center opacity-20">
            <Sparkles size={24} className="mx-auto mb-2 text-indigo-300" />
            <p className="text-[9px] font-black uppercase tracking-widest">No updates yet</p>
          </div>
        )}
      </div>

      <div className="relative">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          placeholder="スタッフへ共有事項を入力..."
          className="w-full bg-white border-none rounded-[1.2rem] py-4 pl-5 pr-12 text-[11px] font-bold placeholder:text-slate-300 shadow-inner"
        />
        <button 
          onClick={handlePost}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-indigo-100"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};