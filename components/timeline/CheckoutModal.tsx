"use client";
import React, { useState, useMemo } from 'react';
import { X, CreditCard, Banknote, ShoppingBag, Plus, Sparkles, Receipt } from 'lucide-react';
import { Appointment, Service, Sale } from '@/types';

interface Props {
  appointment: Appointment;
  services: Service[];
  onClose: () => void;
  onConfirm: (saleData: Partial<Sale>) => void; // Sale型に準拠
}

export const CheckoutModal = ({ appointment, services, onClose, onConfirm }: Props) => {
  // 1. サービスのマスターから該当メニューを取得
  const selectedService = useMemo(() => 
    services.find(s => s.name === appointment.menu_name),
    [services, appointment.menu_name]
  );

  // 2. 料金設定（型定義に基づき、初期値はマスターの価格）
  const [menuAmount, setMenuAmount] = useState(selectedService?.price || 0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // 3. 計算ロジック (内税計算)
  const taxRate = selectedService?.tax_rate || 0.1; // デフォルト10%
  const totalAmount = menuAmount;
  const netAmount = Math.round(totalAmount / (1 + taxRate));
  const taxAmount = totalAmount - netAmount;

  const handleConfirm = () => {
    const shopId = localStorage.getItem('aura_shop_id');
    if (!shopId) return;

    // 型定義 Sale に合わせたデータ構造
    const saleData: Partial<Sale> = {
      shop_id: shopId,
      customer_id: appointment.customer_id,
      appointment_id: appointment.id,
      customer_name: appointment.customer_name,
      staff_id: appointment.staff_id,
      menu_name: appointment.menu_name,
      total_amount: totalAmount,
      net_amount: netAmount,
      tax_amount: taxAmount,
      payment_method: paymentMethod,
      created_at: new Date().toISOString()
    };

    onConfirm(saleData);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-slate-900 p-10 text-white text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-2">Total Payment</p>
          <div className="text-6xl font-black italic tracking-tighter">
            ¥{totalAmount.toLocaleString()}
          </div>
        </div>

        <div className="p-10 space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Service Fee: {appointment.menu_name}</label>
            <div className="relative">
              <input 
                type="number" 
                value={menuAmount}
                onChange={(e) => setMenuAmount(Number(e.target.value))}
                className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-black text-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <span className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-slate-300">円</span>
            </div>
            <div className="flex justify-between px-2 text-[10px] font-bold text-slate-400">
              <span>税抜: ¥{netAmount.toLocaleString()}</span>
              <span>消費税({taxRate * 100}%): ¥{taxAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'cash', label: '現金', icon: <Banknote size={18}/> },
              { id: 'card', label: 'カード', icon: <CreditCard size={18}/> },
              { id: 'qr', label: 'QR', icon: <Receipt size={18}/> },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase transition-all border-2 ${
                  paymentMethod === method.id 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                  : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                }`}
              >
                {method.icon}{method.label}
              </button>
            ))}
          </div>

          <button 
            onClick={handleConfirm}
            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 group"
          >
            Checkout & Save <Sparkles size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};