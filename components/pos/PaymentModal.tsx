"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Appointment, Service, Product } from '@/types';
import { 
  X, Plus, Minus, ShoppingCart, 
  CreditCard, Banknote, Smartphone, Receipt,
  Scissors, Package, Trash2, FileText, Copy, Check
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
  
  // LINEメッセージ生成用ステート
  const [showCopyArea, setShowCopyArea] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);

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
    const { data } = await supabase.from('products').select('*');
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

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const taxAmount = Math.round(totalAmount - (totalAmount / 1.1));
  const netAmount = totalAmount - taxAmount;

  // LINEメッセージ生成ロジック
  const generateMessage = () => {
    const menuList = cart.map(item => `・${item.name}`).join('\n');
    const nextVisit = new Date();
    nextVisit.setDate(nextVisit.getDate() + 45); // 45日後を目安
    const nextMonth = nextVisit.getMonth() + 1;
    const nextDay = nextVisit.getDate();

    const text = `${app.customer_name} 様

本日は AURA STUDIO へご来店いただき、誠にありがとうございました！

【本日のメニュー】
${menuList}
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
    await navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]">
        
        {/* 左側：選択エリア */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50 border-r border-slate-100 custom-scrollbar">
          <div className="flex items-center gap-3 mb-8">
            <ShoppingCart className="text-indigo-600" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">伝票の作成 ＆ 施術メモ</h3>
          </div>

          <div className="space-y-8">
            {/* 技術メニュー */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">技術メニュー</p>
              <div className="grid grid-cols-2 gap-3">
                {services.map(s => (
                  <button key={s.id} onClick={() => addToCart(s, 'service')} className="p-4 bg-white rounded-2xl border border-slate-200 text-left hover:border-indigo-500 transition-all group">
                    <div className="text-xs font-black text-slate-900 truncate mb-1">{s.name}</div>
                    <div className="text-indigo-600 font-black text-sm italic">¥{s.price.toLocaleString()}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 店販商品 */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">店販商品</p>
              <div className="grid grid-cols-2 gap-3">
                {products.map(p => (
                  <button key={p.id} onClick={() => addToCart(p, 'product')} className="p-4 bg-white rounded-2xl border border-slate-200 text-left hover:border-emerald-500 transition-all">
                    <div className="text-xs font-black text-slate-900 truncate mb-1">{p.name}</div>
                    <div className="text-emerald-600 font-black text-sm italic">¥{p.price.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-400 mt-1">在庫: {p.stock}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 施術メモ */}
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={14} className="text-amber-500" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">施術メモ・カルテ記録</p>
              </div>
              <textarea 
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="例：カラー配合 8-GB:6% = 1:1。前髪短め希望。"
                className="w-full bg-white border-2 border-slate-100 rounded-[2rem] p-6 text-sm font-bold focus:border-amber-400 outline-none transition-all h-32 resize-none shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* 右側：サマリーエリア */}
        <div className="w-full md:w-[400px] p-8 flex flex-col bg-white">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter text-slate-900 uppercase">会計確認</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase mt-1">お客様: {app.customer_name} 様</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X/></button>
          </div>

          <div className="flex-1 overflow-y-auto mb-8 space-y-4 custom-scrollbar">
            {cart.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.type === 'service' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {item.type === 'service' ? <Scissors size={14}/> : <Package size={14}/>}
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-slate-900">{item.name} x {item.qty}</div>
                    <div className="text-[10px] text-slate-400 font-bold italic">¥{(item.price * item.qty).toLocaleString()}</div>
                  </div>
                </div>
                <button onClick={() => removeFromCart(index)} className="p-2 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={16}/>
                </button>
              </div>
            ))}
          </div>

          {/* LINEメッセージコピーエリア（表示フラグ時のみ） */}
          {showCopyArea && (
            <div className="mb-6 bg-indigo-50 p-4 rounded-3xl border-2 border-indigo-100 animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-indigo-600 uppercase">LINE After Message</span>
                <button onClick={copyToClipboard} className="text-indigo-600 hover:text-indigo-800 transition-colors">
                  {copied ? <Check size={16}/> : <Copy size={16}/>}
                </button>
              </div>
              <pre className="text-[10px] font-bold text-slate-600 leading-tight h-24 overflow-y-auto whitespace-pre-wrap">
                {generatedText}
              </pre>
            </div>
          )}

          {/* 支払い方法選択 */}
          <div className="grid grid-cols-3 gap-2 mb-8">
            {[
              { id: 'cash', icon: Banknote, label: '現 金' },
              { id: 'card', icon: CreditCard, label: 'カード' },
              { id: 'qr', icon: Smartphone, label: 'QR・他' }
            ].map(m => (
              <button 
                key={m.id} 
                onClick={() => setPaymentMethod(m.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${paymentMethod === m.id ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 text-slate-400'}`}
              >
                <m.icon size={20}/>
                <span className="text-[9px] font-black">{m.label}</span>
              </button>
            ))}
          </div>

          {/* 合計金額 */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white mb-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">お支払い合計</span>
                <span className="text-[10px] font-black text-indigo-400 uppercase">(10% 税込)</span>
              </div>
              <div className="text-4xl font-black italic tracking-tighter mb-4">¥{totalAmount.toLocaleString()}</div>
              
              <div className="flex justify-between border-t border-white/10 pt-4">
                <div className="text-center">
                  <div className="text-[8px] text-slate-500 uppercase font-black">税抜金額</div>
                  <div className="text-xs font-bold font-mono">¥{netAmount.toLocaleString()}</div>
                </div>
                <div className="text-center">
                  <div className="text-[8px] text-slate-500 uppercase font-black">内消費税</div>
                  <div className="text-xs font-bold font-mono text-indigo-400">¥{taxAmount.toLocaleString()}</div>
                </div>
              </div>
            </div>
            <Receipt className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 -rotate-12" />
          </div>

          {/* ボタンエリアの出し分け */}
          {!showCopyArea ? (
            <button 
              onClick={generateMessage}
              disabled={cart.length === 0}
              className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-lg uppercase shadow-2xl shadow-indigo-200 hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50"
            >
              メッセージを生成して完了
            </button>
          ) : (
            <button 
              onClick={handleFinalize}
              className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-lg uppercase shadow-2xl hover:bg-indigo-700 transition-all active:scale-95"
            >
              会計を確定して閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
};