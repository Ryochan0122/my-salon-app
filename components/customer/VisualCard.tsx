"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Camera, Trash2, Plus, Image as ImageIcon, MessageSquare, X } from 'lucide-react';

export const VisualCard = ({ customerId }: { customerId: string }) => {
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any>(null); // モーダル表示用

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
      const fileName = `${customerId}/${Date.now()}.${fileExt}`; // Math.randomよりDate.nowが安全
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('visual-notes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('visual-notes')
        .getPublicUrl(filePath);

      await supabase.from('visual_history').insert([{
        customer_id: customerId,
        image_url: publicUrl,
        storage_path: filePath // 削除時に必要なので保存しておく
      }]);

      fetchImages();
    } catch (error) {
      alert('アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (img: any) => {
    if (!confirm('この写真を削除してもよろしいですか？')) return;

    try {
      // 1. Storageから削除
      if (img.storage_path) {
        await supabase.storage.from('visual-notes').remove([img.storage_path]);
      }
      // 2. DBから削除
      await supabase.from('visual_history').delete().eq('id', img.id);
      
      setImages(images.filter(i => i.id !== img.id));
      setSelectedImage(null);
    } catch (error) {
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
            <Camera size={18} className="text-indigo-600" /> Visual Archive
          </h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Before / After Records</p>
        </div>
        <label className="cursor-pointer bg-slate-900 hover:bg-indigo-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black transition-all flex items-center gap-2 shadow-xl active:scale-95">
          <Plus size={14} /> ADD PHOTO
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {uploading && (
          <div className="aspect-[4/5] bg-slate-100 rounded-[2rem] animate-pulse flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-black text-slate-400 uppercase">Uploading...</span>
          </div>
        )}
        
        {images.map((img) => (
          <div 
            key={img.id} 
            onClick={() => setSelectedImage(img)}
            className="group relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-100 border border-slate-100 cursor-pointer hover:shadow-2xl transition-all"
          >
            <img src={img.image_url} alt="style" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
              <span className="text-[10px] text-white font-black italic tracking-tighter">
                {new Date(img.created_at).toLocaleDateString('ja-JP')}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
                  <MessageSquare size={10} className="text-white" />
                </div>
                <span className="text-[8px] text-white/70 font-bold uppercase tracking-widest">View Detail</span>
              </div>
            </div>
          </div>
        ))}

        {images.length === 0 && !uploading && (
          <div className="col-span-full py-20 border-4 border-dashed border-slate-50 rounded-[3.5rem] flex flex-col items-center justify-center text-slate-200">
            <ImageIcon size={48} strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4">No Visual Records</p>
          </div>
        )}
      </div>

      {/* 拡大表示モーダル */}
      {selectedImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={() => setSelectedImage(null)} />
          <div className="relative max-w-lg w-full bg-white rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <img src={selectedImage.image_url} className="w-full aspect-[4/5] object-cover" />
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recording Date</p>
                  <p className="text-xl font-black italic">{new Date(selectedImage.created_at).toLocaleDateString('ja-JP')}</p>
                </div>
                <button 
                  onClick={() => deleteImage(selectedImage)}
                  className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <button 
                onClick={() => setSelectedImage(null)}
                className="w-full py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};