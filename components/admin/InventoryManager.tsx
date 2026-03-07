"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, AlertTriangle, Plus, Minus, Search, Tag } from 'lucide-react';
import { Product } from '@/types';

export const InventoryManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInventory = async () => {
    setLoading(true);
    const shopId = localStorage.getItem('aura_shop_id');
    
    let query = supabase.from('inventory').select('*').eq('category', 'product').order('stock', { ascending: true });
    if (shopId) query = query.eq('shop_id', shopId);

    const { data } = await query;
    setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, []);

  const updateStock = async (id: string, newStock: number) => {
    const { error } = await supabase
      .from('inventory')
      .update({ stock: newStock })
      .eq('id', id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Tag size={16} className="text-indigo-500" />
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">Inventory Asset</span>
          </div>
          <h2 className="text-5xl font-black italic text-slate-900 tracking-tighter uppercase leading-none">
            Stock <span className="text-rose-500">Control</span>
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text" 
              placeholder="商品を検索..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm w-full md:w-64 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
            />
          </div>
          <div className="bg-rose-50 px-6 py-4 rounded-2xl border border-rose-100 flex items-center gap-3">
            <AlertTriangle className="text-rose-500" size={20} />
            <span className="text-[11px] font-black text-rose-600 uppercase">Low Stock: {products.filter(p => p.stock <= 3).length}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className={`group bg-white rounded-[3rem] p-8 shadow-sm border-2 transition-all hover:shadow-xl hover:-translate-y-1 ${product.stock <= 3 ? 'border-rose-100 bg-rose-50/10' : 'border-slate-50'}`}>
            <div className="flex justify-between items-start mb-8">
              <div className={`p-4 rounded-[1.5rem] shadow-lg transition-transform group-hover:scale-110 ${product.stock <= 3 ? 'bg-rose-500 text-white' : 'bg-slate-950 text-white'}`}>
                <Package size={24} />
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest block mb-1">Unit Price</span>
                <span className="text-2xl font-black text-slate-900 italic">¥{product.price.toLocaleString()}</span>
              </div>
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-1 truncate group-hover:text-indigo-600 transition-colors">{product.name}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category || 'Product'}</p>
            
            <div className="flex items-center gap-4 mt-10 bg-slate-50 p-3 rounded-[2rem] border border-slate-100/50">
              <button 
                onClick={() => updateStock(product.id, Math.max(0, product.stock - 1))}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 hover:shadow-md active:scale-90 transition-all"
              >
                <Minus size={20} />
              </button>
              <div className="flex-1 text-center">
                <span className={`text-3xl font-black italic ${product.stock <= 3 ? 'text-rose-600' : 'text-slate-900'}`}>{product.stock}</span>
                <span className="text-[8px] font-black text-slate-300 block uppercase tracking-tighter">Current Stocks</span>
              </div>
              <button 
                onClick={() => updateStock(product.id, product.stock + 1)}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:shadow-md active:scale-90 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            {product.stock <= 3 && (
              <div className="mt-6 flex items-center justify-center gap-2 py-3 bg-rose-500/10 rounded-2xl text-rose-500 animate-pulse">
                <AlertTriangle size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">要発注 / LOW STOCK</span>
              </div>
            )}
          </div>
        ))}

        <button className="rounded-[3rem] border-4 border-dashed border-slate-100 p-8 flex flex-col items-center justify-center text-slate-200 hover:text-indigo-300 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group min-h-[320px]">
          <Plus size={48} className="mb-4 group-hover:rotate-90 transition-transform" />
          <span className="font-black text-[10px] uppercase tracking-[0.3em]">Register New Item</span>
        </button>
      </div>
    </div>
  );
};