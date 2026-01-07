"use client";
import React, { useState } from 'react';
import { Copy, Check, MessageCircle, Sparkles } from 'lucide-react';

interface Props {
  customerName: string;
  menuName: string;
  memo: string;
}

export const MessageGenerator = ({ customerName, menuName, memo }: Props) => {
  const [copied, setCopied] = useState(false);

  // 現場でよく使うテンプレートを自動構成
  const generateMessage = () => {
    const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
    
    return `${customerName} 様

本日はご来店ありがとうございました！
${today}に担当させていただきました。

本日のメニュー：${menuName}
${memo ? `\n【本日のポイント】\n${memo}\n` : ''}
その後、髪の状態はいかがでしょうか？
お伝えしたスタイリング方法など、ご不明な点があればいつでもLINEでご相談くださいね。

またのご来店を心よりお待ちしております！`;
  };

  const message = generateMessage();

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-600" /> 次回予約に繋げるメッセージ
        </h4>
        <button 
          onClick={handleCopy}
          className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black transition-all ${
            copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'コピーしました' : 'メッセージをコピー'}
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 text-sm text-slate-600 font-medium leading-relaxed shadow-inner border border-indigo-50">
        <pre className="whitespace-pre-wrap font-sans">{message}</pre>
      </div>

      <p className="mt-4 text-[10px] text-indigo-400 font-bold text-center">
        ※コピーしてLINEやDMに貼り付けて送信してください
      </p>
    </div>
  );
};