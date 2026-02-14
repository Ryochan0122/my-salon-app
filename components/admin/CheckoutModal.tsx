"use client";
import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Camera, CreditCard, Scissors, Package, Loader2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Propsの型をCoreSystem側のデータ構造に合わせる
interface Props {
  customer: {
    id: string | null;
    name: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const CheckoutModal = ({ customer, onClose, onSuccess }: Props) => {
  const [items, setItems] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState('');

  // 商品とメニューの取得
  useEffect(() => {
    const fetchItems = async () => {
      const sid = localStorage.getItem('aura_shop_id');
      if (!sid) return;
      const { data } = await supabase
        .from('inventory')
        .select('*')
        .eq('shop_id', sid);
      setAvailableProducts(data || []);
    };
    fetchItems();
  }, []);

  const totalAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  const addItem = (product: any) => {
    const exists = items.find(i => i.id === product.id);
    if (exists) {
      setItems(items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { ...product, quantity: 1 }]);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setLoading(true);
    const shopId = localStorage.getItem('aura_shop_id');

    try {
      // 1. 売上登録
      const { error: saleError } = await supabase.from('sales').insert([{
        customer_id: customer.id,
        customer_name: customer.name,
        shop_id: shopId,
        total_amount: totalAmount,
        menu_name: items.map(i => i.name).join(', '),
        memo: memo
      }]);

      if (saleError) throw saleError;

      // 2. 在庫減算 (RPC呼び出し)
      for (const item of items) {
        if (item.category === 'product') {
          await supabase.rpc('decrement_inventory', { 
            row_id: item.id, 
            quantity: item.quantity 
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('会計処理に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white h-full w-full max-w-2xl rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
        
        <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">New Transaction</p>
            <h2 className="text-3xl font-black italic tracking-tighter text-slate-900">{customer.name} 様</h2>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-slate-50 rounded-full transition-colors"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Plus size={14} /> Select Menu / Products
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {availableProducts.map(p => (
                <button 
                  key={p.id} 
                  onClick={() => addItem(p)}
                  className="p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-indigo-200 hover:bg-white transition-all text-left"
                >
                  <div className="flex justify-between items-start mb-2">
                    {p.category === 'service' ? <Scissors size={18} className="text-slate-400" /> : <Package size={18} className="text-slate-400" />}
                  </div>
                  <p className="font-black text-slate-900 text-sm">{p.name}</p>
                  <p className="font-black italic text-slate-400 text-xs">¥{p.price.toLocaleString()}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 rounded-[3rem] p-8 text-white">
            <div className="space-y-4 mb-8">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center text-[10px] font-black">{item.quantity}</span>
                    <span className="font-bold text-sm">{item.name}</span>
                  </div>
                  <span className="font-black italic">¥{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="pt-6 border-t border-white/10 flex justify-between items-end">
              <p className="text-[10px] font-black uppercase text-slate-500">Total</p>
              <p className="text-4xl font-black italic tracking-tighter">¥{totalAmount.toLocaleString()}</p>
            </div>
          </section>

          <textarea 
            placeholder="Technical notes..."
            className="w-full bg-slate-50 rounded-[2rem] p-6 border-none focus:ring-2 ring-indigo-500 outline-none font-bold text-sm resize-none"
            rows={4} value={memo} onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <div className="p-10 bg-white border-t border-slate-50">
          <button 
            disabled={items.length === 0 || loading}
            onClick={handleCheckout}
            className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-xl shadow-indigo-200 flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><CreditCard size={20} /> Complete Payment</>}
          </button>
        </div>
      </div>
    </div>
  );
};