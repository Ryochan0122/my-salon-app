"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Save, X, RotateCcw, MousePointer2 } from 'lucide-react';

interface Props {
  imageUrl: string;
  onSave: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

/**
 * 施術写真に赤ペン等でメモを描き込むコンポーネント
 */
export const VisualAnnotation = ({ imageUrl, onSave, onClose }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ef4444'); // デフォルトは赤
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // Supabase Storageからの画像をCanvasで扱うためのCORS設定
    img.crossOrigin = "anonymous"; 
    img.src = imageUrl;

    img.onload = () => {
      // 画像のオリジナルの解像度を維持してCanvasを設定
      canvas.width = img.width;
      canvas.height = img.height;
      if (ctx) {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.drawImage(img, 0, 0);
      }
    };
  }, [imageUrl]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    
    // 表示サイズと実際のCanvas解像度の比率を計算
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // ペンの太さを画像サイズに合わせて動的に調整（目安：短辺の1%程度）
    const baseLineWidth = Math.min(canvasRef.current.width, canvasRef.current.height) * 0.01;
    ctx.lineWidth = baseLineWidth > 5 ? baseLineWidth : 5;
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    canvasRef.current?.getContext('2d')?.beginPath();
  };

  const handleSave = async () => {
    if (!canvasRef.current || isSaving) return;
    
    setIsSaving(true);
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          await onSave(blob);
        }
        setIsSaving(false);
      }, 'image/jpeg', 0.9);
    } catch (err) {
      console.error("Save error:", err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-md flex flex-col p-4 md:p-8">
      {/* ツールバー */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div>
          <h3 className="text-white font-black italic tracking-tighter text-3xl uppercase">
            Visual <span className="text-indigo-500">Annotation</span>
          </h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">
            施術箇所や注意点を画像に記録
          </p>
        </div>

        <div className="flex items-center gap-6 bg-white/5 p-4 rounded-[2rem] border border-white/10">
          {/* カラーパレット */}
          <div className="flex gap-3 px-2">
            {[
              { label: 'Red', hex: '#ef4444' },
              { label: 'Blue', hex: '#3b82f6' },
              { label: 'Yellow', hex: '#f59e0b' },
              { label: 'White', hex: '#ffffff' }
            ].map((c) => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                className={`w-10 h-10 rounded-full transition-all hover:scale-110 shadow-lg ${color === c.hex ? 'ring-4 ring-white ring-offset-4 ring-offset-slate-900 scale-110' : 'opacity-50 hover:opacity-100'}`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
          </div>

          <div className="h-8 w-px bg-white/10 mx-2" />

          {/* アクションボタン */}
          <div className="flex gap-3">
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-500 transition-all shadow-xl disabled:opacity-50"
            >
              {isSaving ? <RotateCcw className="animate-spin" size={16}/> : <Save size={16}/>}
              {isSaving ? 'Saving...' : 'Save Record'}
            </button>
            
            <button 
              onClick={onClose} 
              className="bg-white/10 text-white p-3 rounded-2xl hover:bg-red-500 transition-all group"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform"/>
            </button>
          </div>
        </div>
      </div>

      {/* キャンバスエリア */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-slate-900 rounded-[3rem] border border-white/5 shadow-inner">
        <div className="absolute top-6 left-6 flex items-center gap-2 text-white/20 font-black text-[10px] uppercase tracking-widest pointer-events-none">
          <MousePointer2 size={12} />
          Drag to Draw
        </div>
        
        <canvas 
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="max-w-full max-h-full cursor-crosshair shadow-2xl bg-white touch-none animate-in zoom-in-95 duration-500"
        />
      </div>
    </div>
  );
};