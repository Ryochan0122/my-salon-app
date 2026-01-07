"use client";
import React, { useState, useEffect } from 'react';
import { supabase, getCurrentShopId } from '@/lib/supabase';
import { Camera, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';

interface Props {
  customerId: string;
}

/**
 * 顧客詳細画面などで使用する、写真一覧のカードコンポーネント
 */
export const VisualCard = ({ customerId }: Props) => {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchImages();
    }
  }, [customerId]);

  const fetchImages = async () => {
    try {
      const shopId = await getCurrentShopId();
      if (!shopId) return;

      const { data, error } = await supabase
        .from('visual_history')
        .select('*')
        .eq('customer_id', customerId)
        .eq('shop_id', shopId) // 👈 店舗IDで絞り込み
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error('Fetch images error:', err);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const shopId = await getCurrentShopId();
      if (!shopId) throw new Error("店舗情報の取得に失敗しました");

      setUploading(true);

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      // ストレージパスを shop_id/customer_id/filename にして整理
      const fileName = `${shopId}/${customerId}/${Date.now()}.${fileExt}`;

      // 1. Storageにアップロード (バケット名を 'customer-photos' に統一)
      const { error: uploadError } = await supabase.storage
        .from('customer-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. 公開URL取得
      const { data: { publicUrl } } = supabase.storage
        .from('customer-photos')
        .getPublicUrl(fileName);

      // 3. DBにURLを保存 (shop_id を忘れずに)
      const { error: dbError } = await supabase.from('visual_history').insert([{
        shop_id: shopId,
        customer_id: customerId,
        image_url: publicUrl,
        note: '新規追加'
      }]);

      if (dbError) throw dbError;

      fetchImages();
    } catch (error: any) {
      alert('アップロードに失敗しました: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <Camera size={16} className="text-indigo-500" /> Visual Archive
        </h4>
        <label className="cursor-pointer bg-slate-900 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl active:scale-95">
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add Photo
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleUpload} 
            disabled={uploading} 
          />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {uploading && (
          <div className="aspect-square bg-slate-50 border-2 border-dashed border-indigo-100 rounded-[2rem] flex flex-col items-center justify-center text-[10px] font-black text-indigo-400 uppercase gap-2">
            <Loader2 size={20} className="animate-spin" />
            Uploading...
          </div>
        )}
        
        {images.map((img) => (
          <div key={img.id} className="group relative aspect-square rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
            <img 
              src={img.image_url} 
              alt="style history" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
              <span className="text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Visit Date</span>
              <span className="text-xs text-white font-black italic">
                {new Date(img.created_at).toLocaleDateString('ja-JP')}
              </span>
            </div>
          </div>
        ))}

        {images.length === 0 && !uploading && (
          <div className="col-span-full py-16 border-4 border-dashed border-slate-50 rounded-[3rem] flex flex-col items-center justify-center text-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <ImageIcon size={32} strokeWidth={1} className="text-slate-200" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No Visual Notes</p>
          </div>
        )}
      </div>
    </div>
  );
};