"use client";
import React, { useState } from 'react';
import { Copy, Check, MessageCircle, Sparkles, Send } from 'lucide-react';

interface Props {
  customerName: string;
  menuName: string;
  memo: string;
}

/**
 * 施術後のアフターフォローメッセージを生成するコンポーネント
 */
export const MessageGenerator = ({ customerName, menuName, memo }: Props) => {
  const [copied, setCopied] = useState(false);

  // メッセージの生成ロジック
  const generateMessage = () => {
    const today = new Date().toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' });
    
    // 店舗の雰囲気に合わせて調整可能なテンプレート
    return `${customerName} 様

本日はご来店ありがとうございました！
${today}に担当させていただきました。

【本日のメニュー】
${menuName}
${memo ? `\n【スタイリングのポイント】\n${memo}\n` : ''}
その後、髪の状態（色もちや扱いやすさ）はいかがでしょうか？
お伝えしたケア方法など、気になることがあればいつでもこのLINEでご相談くださいね。

またお会いできるのを楽しみにしております！`;
  };

  const message = generateMessage();

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 直接LINEを開くためのURL（オプション）
  const openLine = () => {
    handleCopy();
    // LINEアプリを開く（テキストはクリップボードから貼り付けを想定）
    window.open('https://line.me/R/', '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-[2.5rem] p-8 border border-indigo-100 shadow-sm">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" /> 
            After-Follow <span className="text-indigo-400">Message</span>
          </h4>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">
            コピーしてLINEやDMに貼り付けてください
          </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleCopy}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${
              copied 
                ? 'bg-emerald-500 text-white' 
                : 'bg-slate-900 text-white hover:bg-indigo-600'
            }`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Text'}
          </button>
          
          <button 
            onClick={openLine}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-[#06C755] text-white rounded-2xl font-black text-[10px] hover:opacity-90 transition-all shadow-lg"
            title="LINEを開く"
          >
            <MessageCircle size={18} />
          </button>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-100 to-rose-100 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
        <div className="relative bg-white rounded-[2rem] p-7 text-sm text-slate-600 font-medium leading-relaxed border border-indigo-50 shadow-inner">
          <pre className="whitespace-pre-wrap font-sans break-words">{message}</pre>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 p-4 bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-200">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm">
          <Send size={14} />
        </div>
        <p className="text-[10px] text-indigo-700 font-bold leading-tight">
          次回の目安：本日の${menuName}から約1.5ヶ月〜2ヶ月後がおすすめです。
        </p>
      </div>
    </div>
  );
};