"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, AlertTriangle, Plus, Minus, History, Save } from 'lucide-react';
import { Product } from '@/types';

export const InventoryManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('stock', { ascending: true }); // 在庫が少ない順に表示
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  const updateStock = async (id: string, newStock: number) => {
    const { error } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', id);
    if (!error) fetchInventory();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-700">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black italic text-slate-900 tracking-tighter uppercase">
            Inventory <span className="text-rose-500">.</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">店販・在庫管理システム</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 flex items-center gap-3">
            <AlertTriangle className="text-rose-500" size={20} />
            <span className="text-sm font-black text-rose-600">在庫不足: {products.filter(p => p.stock <= 3).length}件</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className={`bg-white rounded-[2.5rem] p-8 shadow-sm border-2 transition-all ${product.stock <= 3 ? 'border-rose-100 bg-rose-50/20' : 'border-slate-50'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl ${product.stock <= 3 ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'}`}>
                <Package size={24} />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">単価</span>
                <span className="text-xl font-black text-slate-900 italic">¥{product.stock.toLocaleString()}</span>
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2 truncate">{product.name}</h3>
            
            <div className="flex items-center gap-4 mt-8 bg-slate-50 p-4 rounded-3xl">
              <button 
                onClick={() => updateStock(product.id, Math.max(0, product.stock - 1))}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:shadow-md transition-all"
              >
                <Minus size={20} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-black italic text-slate-900">{product.stock}</span>
                <span className="text-[10px] font-black text-slate-400 block uppercase">STOCKS</span>
              </div>
              <button 
                onClick={() => updateStock(product.id, product.stock + 1)}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:shadow-md transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            {product.stock <= 3 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-rose-500 animate-pulse">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-black uppercase">発注が必要です</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};