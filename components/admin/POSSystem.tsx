"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, User, CreditCard, Banknote, Calculator, Trash2, Save, Scissors } from 'lucide-react';

export const POSSystem = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 会計用ステート
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [memo, setMemo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: cData } = await supabase.from('customers').select('*').order('name');
    const { data: sData } = await supabase.from('services').select('*').order('name');
    setCustomers(cData || []);
    setServices(sData || []);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchQuery) || c.kana?.includes(searchQuery)
  );

  const addToCart = (service: any) => {
    setCart([...cart, { ...service, cartId: Math.random() }]);
  };

  const removeFromCart = (cartId: number) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
  const taxAmount = Math.floor(totalAmount * 0.1);
  const netAmount = totalAmount - taxAmount;

  const handleCheckout = async () => {
    if (!selectedCustomer) return alert("顧客を選択してください");
    if (cart.length === 0) return alert("メニューを選択してください");

    try {
      // 1. salesテーブルにメインレコードを作成
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          customer_id: selectedCustomer.id,
          customer_name: selectedCustomer.name,
          total_amount: totalAmount,
          net_amount: netAmount,
          tax_amount: taxAmount,
          payment_method: paymentMethod,
          memo: memo, // 会計メモをカルテとして保存
          menu_name: cart.map(item => item.name).join(' / ')
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. sale_itemsに明細を保存
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        item_name: item.name,
        price: item.price,
        item_type: 'service'
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      alert("お会計が完了しました。\n顧客カルテから写真を追加できます。");
      
      // 状態リセット
      setCart([]);
      setMemo('');
      setSelectedCustomer(null);
    } catch (error: any) {
      alert("エラー: " + error.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[85vh] animate-in fade-in duration-500">
      
      {/* 左：顧客 & メニュー選択 */}
      <div className="flex-1 flex flex-col gap-6 min-h-0">
        {/* 顧客検索 */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="text-indigo-600" size={20} />
            <h3 className="font-black italic text-lg uppercase tracking-tighter">Select Client</h3>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="名前・フリガナで検索..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {filteredCustomers.slice(0, 10).map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedCustomer(c)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${selectedCustomer?.id === c.id ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-50'}`}
              >
                {c.name} 様
              </button>
            ))}
          </div>
        </div>

        {/* メニュー選択 */}
        <div className="flex-1 bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-50 overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 mb-6">
            <Scissors className="text-indigo-600" size={20} />
            <h3 className="font-black italic text-lg uppercase tracking-tighter">Menu</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {services.map(s => (
              <button 
                key={s.id} 
                onClick={() => addToCart(s)}
                className="p-4 text-left bg-slate-50 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all group"
              >
                <div className="font-black text-sm mb-1">{s.name}</div>
                <div className="text-[10px] font-bold opacity-60 group-hover:opacity-100">¥{s.price.toLocaleString()}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 右：カート & 会計詳細 */}
      <div className="w-full md:w-96 bg-slate-900 rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden text-white">
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
          <h3 className="text-2xl font-black italic tracking-tighter mb-8 flex items-center gap-3">
            <Calculator size={24} className="text-indigo-400" /> CHECKOUT
          </h3>

          {/* 選択中の顧客 */}
          {selectedCustomer ? (
            <div className="bg-white/10 p-4 rounded-2xl mb-6 flex items-center justify-between border border-white/10">
              <div>
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Client</p>
                <p className="font-black text-sm">{selectedCustomer.name} 様</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="bg-rose-500/20 p-4 rounded-2xl mb-6 border border-rose-500/20 text-rose-300 text-[10px] font-black tracking-widest text-center uppercase">
              顧客を選択してください
            </div>
          )}

          {/* カート明細 */}
          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <div key={item.cartId} className="flex justify-between items-center group animate-in slide-in-from-right duration-300">
                <div>
                  <div className="text-xs font-black">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold">¥{item.price.toLocaleString()}</div>
                </div>
                <button onClick={() => removeFromCart(item.cartId)} className="text-slate-600 hover:text-rose-500 transition-colors">
                  <Trash2 size={14}/>
                </button>
              </div>
            ))}
            {cart.length === 0 && (
              <p className="text-center py-4 text-white/20 text-[10px] font-black uppercase tracking-[0.2em]">メニュー未選択</p>
            )}
          </div>

          {/* 施術メモ（カルテ連携） */}
          <div className="space-y-2 mb-8">
            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">施術メモ（カルテ保存）</label>
            <textarea 
              value={memo} onChange={(e) => setMemo(e.target.value)}
              placeholder="今日の調合やポイントを記録..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 h-28 resize-none"
            />
          </div>

          {/* 支払い方法 */}
          <div className="flex gap-2 mb-8">
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={`flex-1 py-3 rounded-xl font-black text-[9px] tracking-widest border transition-all ${paymentMethod === 'cash' ? 'bg-indigo-600 border-indigo-600 shadow-lg' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
            >
              <span className="flex items-center justify-center gap-1"><Banknote size={12}/> 現金</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('credit')}
              className={`flex-1 py-3 rounded-xl font-black text-[9px] tracking-widest border transition-all ${paymentMethod === 'credit' ? 'bg-indigo-600 border-indigo-600 shadow-lg' : 'border-white/10 text-slate-400 hover:bg-white/5'}`}
            >
              <span className="flex items-center justify-center gap-1"><CreditCard size={12}/> カード</span>
            </button>
          </div>
        </div>

        {/* 合計 & 確定ボタン */}
        <div className="p-8 bg-white/5 border-t border-white/10">
          <div className="flex justify-between items-end mb-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total</span>
            <span className="text-4xl font-black italic tracking-tighter">¥{totalAmount.toLocaleString()}</span>
          </div>
          <button 
            onClick={handleCheckout}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-[2rem] font-black text-xs tracking-[0.4em] transition-all shadow-xl shadow-indigo-900/20 flex items-center justify-center gap-2 group active:scale-95"
          >
            お会計を確定する <Save size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

// コンポーネント内で使用するXアイコンの小道具
const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
);