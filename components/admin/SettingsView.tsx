"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ServiceManager } from './ServiceManager';
import { InventoryManager } from './InventoryManager';
import { Users, Scissors, Package, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Service } from '@/types';

export const SettingsView = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<'services' | 'inventory' | 'staff'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 取得処理を useCallback でメモ化して安定させる
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. まず自分のプロフィールから shop_id を確認（SQLリセット直後の不整合対策）
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('shop_id')
        .single();

      if (profileError) throw new Error("プロフィールの取得に失敗しました。再ログインしてください。");

      // 2. shop_id に紐づくサービスを取得
      const { data, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('shop_id', profile.shop_id) // 明示的に絞り込む
        .order('name', { ascending: true });

      if (serviceError) throw serviceError;
      
      setServices(data || []);
    } catch (err: any) {
      console.error('Settings fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return (
    <div className="min-h-screen bg-white">
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 hover:bg-slate-50 rounded-2xl transition-all group">
            <ArrowLeft size={24} className="text-slate-900 group-hover:-translate-x-1 transition-transform" />
          </button>
          <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">System Settings</h2>
        </div>
        
        <nav className="flex bg-slate-100 p-1.5 rounded-[1.5rem]">
          {[
            { id: 'services', icon: Scissors, label: 'メニュー' },
            { id: 'inventory', icon: Package, label: '在庫・店販' },
            { id: 'staff', icon: Users, label: 'スタッフ' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.2rem] text-xs font-black transition-all ${
                activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto p-8">
        {error ? (
          <div className="p-12 bg-red-50 rounded-[3rem] border border-red-100 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-black text-red-900 uppercase italic mb-2">Data Load Error</h3>
            <p className="text-red-600 font-bold mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs"
            >
              再試行する
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'services' && (
              loading ? (
                <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-4">
                  <Loader2 className="animate-spin" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Loading Menu Data...</p>
                </div>
              ) : (
                <ServiceManager 
                  services={services} 
                  onRefresh={fetchServices} 
                />
              )
            )}
            
            {activeTab === 'inventory' && <InventoryManager />}
            
            {activeTab === 'staff' && (
              <div className="p-20 text-center opacity-20 border-4 border-dashed border-slate-100 rounded-[4rem]">
                <Users size={80} className="mx-auto mb-6 text-slate-300" />
                <p className="text-xl font-black uppercase italic tracking-widest text-slate-400">Staff Management<br/><span className="text-sm">coming soon</span></p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};