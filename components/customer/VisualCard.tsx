"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Trash2, Plus, Image as ImageIcon } from 'lucide-react';

export const VisualCard = ({ customerId }: { customerId: string }) => {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, [customerId]);

  const fetchImages = async () => {
    const { data } = await supabase
      .from('visual_history')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    setImages(data || []);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${customerId}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Storageにアップロード
      const { error: uploadError } = await supabase.storage
        .from('visual-notes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. 公開URL取得
      const { data: { publicUrl } } = supabase.storage
        .from('visual-notes')
        .getPublicUrl(filePath);

      // 3. DBにURLを保存
      await supabase.from('visual_history').insert([{
        customer_id: customerId,
        image_url: publicUrl
      }]);

      fetchImages();
    } catch (error) {
      alert('アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Camera size={16} /> ビジュアルカルテ (Before/After)
        </h4>
        <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-indigo-100">
          <Plus size={14} /> 写真を追加
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {uploading && (
          <div className="aspect-square bg-slate-100 rounded-3xl animate-pulse flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
            Uploading...
          </div>
        )}
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square rounded-3xl overflow-hidden bg-slate-100 border border-slate-200">
            <img src={img.image_url} alt="style" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <span className="text-[10px] text-white font-bold">
                {new Date(img.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
        {images.length === 0 && !uploading && (
          <div className="col-span-full py-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300">
            <ImageIcon size={40} strokeWidth={1} />
            <p className="text-xs font-bold mt-2">写真が登録されていません</p>
          </div>
        )}
      </div>
    </div>
  );
};