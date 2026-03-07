"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Appointment, Service, Product } from '@/types';
import { 
  X, ShoppingCart, 
  CreditCard, Banknote, Smartphone, Receipt,
  Scissors, Package, Trash2, FileText, Copy, Check, Tag
} from 'lucide-react';

interface Props {
  app: Appointment;
  services: Service[];
  onClose: () => void;
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
  const [showCopyArea, setShowCopyArea] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

  // 税抜/税込切替
  const [priceMode, setPriceMode] = useState<'tax_in' | 'tax_out'>('tax_in');
  // 割引額
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountInput, setDiscountInput] = useState('');

  useEffect(() => {
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
    const shopId = localStorage.getItem('aura_shop_id');
    let query = supabase.from('inventory').select('*').eq('category', 'product');
    if (shopId) query = query.eq('shop_id', shopId);
    const { data } = await query;
    setProducts(data || []);
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

  // 価格計算
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  // 税抜モードの場合は価格を税抜として扱い、税込に変換して表示
  const subtotalWithMode = priceMode === 'tax_out'
    ? Math.round(subtotal * 1.1)  // 税抜→税込
    : subtotal;                    // 税込そのまま

  const totalAmount = Math.max(0, subtotalWithMode - discountAmount);
  const taxAmount = Math.round(totalAmount - (totalAmount / 1.1));
  const netAmount = totalAmount - taxAmount;

  const handleDiscountInput = (val: string) => {
    setDiscountInput(val);
    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
    setDiscountAmount(isNaN(num) ? 0 : num);
  };

  const generateMessage = () => {
    const menuList = cart.map(item => `・${item.name}`).join('\n');
    const nextVisit = new Date();
    nextVisit.setDate(nextVisit.getDate() + 45);
    const nextMonth = nextVisit.getMonth() + 1;
    const nextDay = nextVisit.getDate();
    const text = `${app.customer_name} 様

本日は AURA STUDIO へご来店いただき、誠にありがとうございました！

【本日のメニュー】
${menuList}${discountAmount > 0 ? `\n割引：-¥${discountAmount.toLocaleString()}` : ''}
合計金額：¥${totalAmount.toLocaleString()}-

【スタイリストより】
${memo || "本日の仕上がり、とてもお似合いでした！"}

【次回来店の目安】
スタイルを綺麗に保つためには、約1.5ヶ月後の「${nextMonth}月${nextDay}日」頃のメンテナンスがおすすめです。

またお会いできるのを楽しみにしております！
AURA STUDIO`;
    setGeneratedText(text);
    setShowCopyArea(true);
  };

  const handleFinalize = () => {
    onConfirm(totalAmount, netAmount, taxAmount, paymentMethod, cart, memo);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-6xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* 左側 */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50 border-r border-slate-100 custom-scrollbar">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white">
              <ShoppingCart size={20} />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">伝票の作成 ＆ 施術メモ</h3>
          </div>

          <div className="space-y-10">
            <section>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-2">Service Menu</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(s => (
                  <button key={s.id} onClick={() => addToCart(s, 'service')} className="p-5 bg-white rounded-[1.5rem] border-2 border-transparent shadow-sm hover:border-indigo-500 hover:shadow-md transition-all text-left group">
                    <div className="text-[11px] font-black text-slate-900 mb-1 truncate">{s.name}</div>
                    <div className="text-indigo-600 font-black text-sm italic">¥{s.price.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 ml-2">Retail Products</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map(p => (
                  <button key={p.id} onClick={() => addToCart(p, 'product')} className="p-5 bg-white rounded-[1.5rem] border-2 border-transparent shadow-sm hover:border-emerald-500 hover:shadow-md transition-all text-left">
                    <div className="text-[11px] font-black text-slate-900 mb-1 truncate">{p.name}</div>
                    <div className="flex justify-between items-end">
                      <div className="text-emerald-600 font-black text-sm italic">¥{p.price.toLocaleString()}</div>
                      <div className="text-[9px] font-bold text-slate-300 uppercase">Stock: {p.stock}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4 ml-2">
                <FileText size={14} className="text-amber-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Stylist Note / Karte</p>
              </div>
              <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="仕上がり、カラー配合、次回への申し送り事項など..."
                className="w-full bg-white border-2 border-slate-100 rounded-[2rem] p-6 text-sm font-bold focus:border-amber-400 outline-none transition-all h-40 resize-none shadow-inner"
              />
            </section>
          </div>
        </div>

        {/* 右側 */}
        <div className="w-full md:w-[420px] p-8 flex flex-col bg-white">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">Checkout</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase mt-1">Client: {app.customer_name}</p>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-300 hover:text-slate-900">
              <X size={24}/>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-3 custom-scrollbar pr-2">
            {cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group animate-in slide-in-from-right-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${item.type === 'service' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {item.type === 'service' ? <Scissors size={14}/> : <Package size={14}/>}
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold italic">¥{item.price.toLocaleString()} × {item.qty}</div>
                  </div>
                </div>
                <button onClick={() => removeFromCart(index)} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={16}/>
                </button>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="text-center py-10 text-slate-300 font-black text-[10px] uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[2rem]">
                No items selected
              </div>
            )}
          </div>

          {/* 税抜/税込切替 + 割引 */}
          <div className="mb-4 space-y-3">
            {/* 税モード切替 */}
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl">
              <button
                onClick={() => setPriceMode('tax_in')}
                className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${priceMode === 'tax_in' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                税込入力
              </button>
              <button
                onClick={() => setPriceMode('tax_out')}
                className={`flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${priceMode === 'tax_out' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
              >
                税抜入力
              </button>
            </div>

            {/* 割引入力 */}
            <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <Tag size={16} className="text-amber-500 flex-none" />
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex-none">割引</span>
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-slate-400 font-black">-¥</span>
                <input
                  type="number"
                  min="0"
                  value={discountInput}
                  onChange={(e) => handleDiscountInput(e.target.value)}
                  placeholder="0"
                  className="w-24 text-right bg-white border-2 border-amber-200 rounded-xl px-3 py-1.5 font-black text-sm focus:border-amber-400 outline-none"
                />
              </div>
            </div>
          </div>

          {showCopyArea && (
            <div className="mb-4 bg-indigo-50 p-5 rounded-[2rem] border-2 border-indigo-100 animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">After-care Message</span>
                <button onClick={copyToClipboard} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-black text-[9px] uppercase">
                  {copied ? <Check size={14}/> : <Copy size={14}/>}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="text-[10px] font-bold text-slate-600 leading-relaxed h-24 overflow-y-auto whitespace-pre-wrap custom-scrollbar pr-2">
                {generatedText}
              </pre>
            </div>
          )}

          {/* 支払い方法 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { id: 'cash', icon: Banknote, label: 'CASH' },
              { id: 'card', icon: CreditCard, label: 'CARD' },
              { id: 'qr', icon: Smartphone, label: 'QR/OTH' }
            ].map(m => (
              <button 
                key={m.id} 
                onClick={() => setPaymentMethod(m.id)}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${paymentMethod === m.id ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' : 'border-slate-100 text-slate-400 hover:border-indigo-200'}`}
              >
                <m.icon size={18}/>
                <span className="text-[8px] font-black uppercase tracking-tighter">{m.label}</span>
              </button>
            ))}
          </div>

          {/* 合計金額パネル */}
          <div className="bg-slate-950 rounded-[2.5rem] p-6 text-white mb-4 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Total Price</span>
                <span className="text-[8px] font-black px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30 uppercase">
                  {priceMode === 'tax_in' ? '税込' : '税抜→税込'} 10%
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="text-amber-400 font-black text-sm italic mb-1">
                  - ¥{discountAmount.toLocaleString()} 割引適用
                </div>
              )}
              <div className="text-4xl font-black italic tracking-tighter mb-4">¥{totalAmount.toLocaleString()}</div>
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div>
                  <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Net Amount</div>
                  <div className="text-sm font-black italic text-slate-300">¥{netAmount.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Consumption Tax</div>
                  <div className="text-sm font-black italic text-indigo-400">¥{taxAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <Receipt className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 -rotate-12 pointer-events-none" />
          </div>

          {!showCopyArea ? (
            <button 
              onClick={generateMessage}
              disabled={cart.length === 0}
              className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-slate-900 hover:shadow-none transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="flex items-center justify-center gap-2">
                Generate Message <Check size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          ) : (
            <button 
              onClick={handleFinalize}
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Finalize Payment <ShoppingCart size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};