"use client";
import React, { useState, useEffect } from 'react';
import { supabase, getCurrentShopId } from '@/lib/supabase';
import { Appointment, Service, Product } from '@/types';
import { 
  X, Plus, ShoppingCart, 
  CreditCard, Banknote, Smartphone, Receipt,
  Scissors, Package, Trash2, FileText, Copy, Check, Sparkles
} from 'lucide-react';

interface Props {
  app: Appointment;
  services: Service[];
  onClose: () => void;
  // 親コンポーネントでDB保存処理を行うためのコールバック
  onConfirm: (
    total: number, 
    net: number, 
    tax: number, 
    method: string, 
    cart: any[], 
    memo: string
  ) => void; 
}

export const PaymentModal = ({ app, services, onClose, onConfirm }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<{id: string, name: string, price: number, type: 'service' | 'product', qty: number}[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [memo, setMemo] = useState('');
  
  // LINEメッセージ生成用
  const [showCopyArea, setShowCopyArea] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 初回表示時、予約されていたメニューをカートに入れる
    const initialService = services.find(s => s.name === app.menu_name);
    if (initialService) {
      setCart([{
        id: initialService.id,
        name: initialService.name,
        price: initialService.price,
        type: 'service',
        qty: 1
      }]);
    }
    fetchProducts();
  }, [app, services]);

  const fetchProducts = async () => {
    try {
      const shopId = await getCurrentShopId();
      if (!shopId) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId) // 👈 自分の店の在庫のみ取得
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Fetch products error:', err);
    }
  };

  const addToCart = (item: any, type: 'service' | 'product') => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.type === type);
      if (existing) {
        return prev.map(i => i.id === item.id && i.type === type ? {...i, qty: i.qty + 1} : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, type, qty: 1 }];
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const taxAmount = Math.round(totalAmount * 0.1); // シンプルに10%計算
  const netAmount = totalAmount - taxAmount;

  const generateMessage = () => {
    const menuList = cart.map(item => `・${item.name}`).join('\n');
    const nextVisit = new Date();
    nextVisit.setDate(nextVisit.getDate() + 45);
    const nextMonth = nextVisit.getMonth() + 1;
    const nextDay = nextVisit.getDate();

    const text = `${app.customer_name} 様

本日はご来店いただき、誠にありがとうございました！

【本日のメニュー】
${menuList}
会計合計：¥${totalAmount.toLocaleString()}-

【担当より】
${memo || "本日の仕上がり、とてもお似合いでした！"}

【次回のメンテナンス目安】
約1.5ヶ月後の「${nextMonth}月${nextDay}日」頃のご予約がおすすめです。

またのご来店を心よりお待ちしております！`;
    
    setGeneratedText(text);
    setShowCopyArea(true);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* 左側：選択エリア */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50 border-r border-slate-100 custom-scrollbar">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Checkout</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">伝票作成とアフターフォロー</p>
            </div>
          </div>

          <div className="space-y-10">
            {/* 技術メニュー */}
            <section>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Services</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map(s => (
                  <button key={s.id} onClick={() => addToCart(s, 'service')} className="p-6 bg-white rounded-[2rem] border border-slate-100 text-left hover:border-indigo-500 hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="text-sm font-black text-slate-900 truncate mb-1">{s.name}</div>
                      <div className="text-indigo-600 font-black text-lg italic">¥{s.price.toLocaleString()}</div>
                    </div>
                    <Plus className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-100 group-hover:text-indigo-50" size={40} />
                  </button>
                ))}
              </div>
            </section>

            {/* 店販商品 */}
            <section>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Products (Inventory)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map(p => (
                  <button key={p.id} onClick={() => addToCart(p, 'product')} className="p-6 bg-white rounded-[2rem] border border-slate-100 text-left hover:border-emerald-500 hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="text-sm font-black text-slate-900 truncate mb-1">{p.name}</div>
                      <div className="text-emerald-600 font-black text-lg italic">¥{p.price.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Stock: {p.stock}</div>
                    </div>
                    <Package className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-100 group-hover:text-emerald-50" size={40} />
                  </button>
                ))}
              </div>
            </section>

            {/* 施術メモ */}
            <section className="pb-10">
              <div className="flex items-center gap-2 mb-4 ml-2">
                <FileText size={14} className="text-amber-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Medical Records & Memo</p>
              </div>
              <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="カラー配合や本日のアドバイスを記入..."
                className="w-full bg-white border border-slate-100 rounded-[2.5rem] p-8 text-sm font-bold focus:ring-4 ring-amber-50 outline-none transition-all h-40 resize-none shadow-sm"
              />
            </section>
          </div>
        </div>

        {/* 右側：サマリーエリア */}
        <div className="w-full md:w-[450px] p-10 flex flex-col bg-white">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Summary</p>
              <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">{app.customer_name} <span className="text-sm not-italic text-slate-400 font-bold">様</span></h2>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"><X/></button>
          </div>

          <div className="flex-1 overflow-y-auto mb-8 space-y-4 custom-scrollbar pr-2">
            {cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center justify-between group bg-slate-50/50 p-4 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.type === 'service' ? 'bg-indigo-600 text-white' : 'bg-emerald-500 text-white'}`}>
                    {item.type === 'service' ? <Scissors size={16}/> : <Package size={16}/>}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold italic">¥{item.price.toLocaleString()} x {item.qty}</div>
                  </div>
                </div>
                <button onClick={() => removeFromCart(index)} className="p-2 text-slate-300 hover:text-rose-500 transition-all">
                  <Trash2 size={18}/>
                </button>
              </div>
            ))}
          </div>

          {/* LINEメッセージプレビュー */}
          {showCopyArea && (
            <div className="mb-8 bg-indigo-50 p-6 rounded-[2.5rem] border border-indigo-100 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <Sparkles size={12} /> LINE After Follow
                </span>
                <button onClick={copyToClipboard} className="p-2 bg-white rounded-xl text-indigo-600 hover:scale-110 transition-all shadow-sm">
                  {copied ? <Check size={16}/> : <Copy size={16}/>}
                </button>
              </div>
              <pre className="text-[11px] font-bold text-slate-600 leading-relaxed h-32 overflow-y-auto whitespace-pre-wrap font-sans">
                {generatedText}
              </pre>
            </div>
          )}

          {/* 支払い方法 */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { id: 'cash', icon: Banknote, label: 'CASH' },
              { id: 'card', icon: CreditCard, label: 'CARD' },
              { id: 'qr', icon: Smartphone, label: 'QR/PAY' }
            ].map(m => (
              <button 
                key={m.id} 
                onClick={() => setPaymentMethod(m.id)}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${paymentMethod === m.id ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-105' : 'border-slate-50 text-slate-400 hover:bg-slate-50'}`}
              >
                <m.icon size={20}/>
                <span className="text-[9px] font-black tracking-widest">{m.label}</span>
              </button>
            ))}
          </div>

          {/* 合計表示 */}
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white mb-8 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Amount</span>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tax Included</span>
              </div>
              <div className="text-5xl font-black italic tracking-tighter mb-6 group-hover:scale-105 transition-transform duration-500 origin-left">
                ¥{totalAmount.toLocaleString()}<span className="text-xl ml-1 opacity-50 font-normal">.</span>
              </div>
              
              <div className="flex justify-between border-t border-white/10 pt-6">
                <div className="text-left">
                  <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Net Sales</div>
                  <div className="text-sm font-black italic">¥{netAmount.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest">VAT (10%)</div>
                  <div className="text-sm font-black italic text-indigo-400">¥{taxAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <Receipt className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5 -rotate-12 transition-transform duration-700 group-hover:rotate-0" />
          </div>

          {/* アクションボタン */}
          {!showCopyArea ? (
            <button 
              onClick={generateMessage}
              disabled={cart.length === 0}
              className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-30"
            >
              Generate Message & Next
            </button>
          ) : (
            <button 
              onClick={() => onConfirm(totalAmount, netAmount, taxAmount, paymentMethod, cart, memo)}
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all active:scale-95"
            >
              Confirm Payment & Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};