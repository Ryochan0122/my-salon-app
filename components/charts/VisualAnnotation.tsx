"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Save, X, RotateCcw } from 'lucide-react';

interface Props {
  imageUrl: string;
  onSave: (blob: Blob) => Promise<void>;
  onClose: () => void;
}

export const VisualAnnotation = ({ imageUrl, onSave, onClose }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ef4444'); // 赤ペン

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous"; // Supabaseからの読み込み対策
    img.src = imageUrl;
    img.onload = () => {
      // 画像の解像度に合わせてキャンバスサイズを設定
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
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
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    
    const x = (('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
    const y = (('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;

    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
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

  const handleSave = () => {
    canvasRef.current?.toBlob((blob) => {
      if (blob) onSave(blob);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/90 flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-black italic tracking-tighter text-2xl uppercase">Edit Visual Note</h3>
        <div className="flex gap-4">
          <button onClick={() => setColor('#ef4444')} className={`w-10 h-10 rounded-full bg-red-500 border-4 ${color === '#ef4444' ? 'border-white' : 'border-transparent'}`} />
          <button onClick={() => setColor('#3b82f6')} className={`w-10 h-10 rounded-full bg-blue-500 border-4 ${color === '#3b82f6' ? 'border-white' : 'border-transparent'}`} />
          <button onClick={handleSave} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-500 transition-all"><Save size={20}/> 保存</button>
          <button onClick={onClose} className="bg-white/10 text-white p-3 rounded-2xl hover:bg-white/20"><X size={24}/></button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <canvas 
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="max-w-full max-h-full cursor-crosshair shadow-2xl bg-white touch-none"
        />
      </div>
    </div>
  );
};