"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ServiceManager } from './ServiceManager';
import { InventoryManager } from './InventoryManager';
import { Users, Scissors, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { Service } from '@/types';

export const SettingsView = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<'services' | 'inventory' | 'staff'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // メニューデータの取得
  const fetchServices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('name', { ascending: true });
    setServices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 hover:bg-slate-50 rounded-2xl transition-all">
            <ArrowLeft size={24} className="text-slate-900" />
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

      <main className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'services' && (
          loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <Loader2 className="animate-spin mr-2" /> 読み込み中...
            </div>
          ) : (
            /* 👈 ここで Props を渡すことでエラーを解消 */
            <ServiceManager 
              services={services} 
              onRefresh={fetchServices} 
            />
          )
        )}
        
        {activeTab === 'inventory' && <InventoryManager />}
        
        {activeTab === 'staff' && (
          <div className="p-20 text-center opacity-20">
            <Users size={64} className="mx-auto mb-4" />
            <p className="font-black uppercase tracking-widest">Staff Management coming soon</p>
          </div>
        )}
      </main>
    </div>
  );
};