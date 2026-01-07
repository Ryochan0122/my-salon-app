"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Camera, Calendar, Image as ImageIcon, Loader2, AlertCircle, 
  Search, Plus, FileText, MoreVertical, History, Edit3
} from 'lucide-react';
import { VisualAnnotation } from './VisualAnnotation';

interface ChartGalleryProps {
  customerId?: string;
  customerName?: string;
  appointments?: any[];
}

export const ChartGallery = ({ customerId, customerName = "お客様",appointments = [] }: ChartGalleryProps) => {
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchVisualHistory();
  }, [customerId]);

  const fetchVisualHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      // SQLスキーマに基づき 'visual_history' テーブルを使用
      let query = supabase.from('visual_history').select('*').order('created_at', { ascending: false });
      if (customerId) query = query.eq('customer_id', customerId);
      
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      setRecords(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File | Blob, isUpdate = false) => {
    if (!customerId) return alert("顧客を選択してください");
    try {
      setIsUploading(true);
      const fileName = `${customerId}/${Date.now()}.jpg`;
      
      // バケット名を 'customer-photos' に統一
      const { error: uploadError } = await supabase.storage
        .from('customer-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('customer-photos').getPublicUrl(fileName);

      // SQLスキーマに基づき 'visual_history' に保存
      const { error: dbError } = await supabase.from('visual_history').insert([
        { 
          customer_id: customerId, 
          image_url: urlData.publicUrl,
          note: isUpdate ? '手書きメモあり' : ''
        }
      ]);

      if (dbError) throw dbError;
      fetchVisualHistory();
      setEditingImageUrl(null);
    } catch (err: any) {
      alert("保存失敗: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredRecords = records.filter(r => 
    (r.note && r.note.includes(searchTerm)) || 
    new Date(r.created_at).toLocaleDateString().includes(searchTerm)
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 text-slate-400">
      <Loader2 className="animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest">Loading Records...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* ヘッダー兼検索バー */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-3xl font-black italic text-slate-900 uppercase tracking-tighter">
            Visual <span className="text-indigo-600">Archives</span>
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
            {customerName} 様のスタイル履歴
          </p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="日付やメモで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <label className="cursor-pointer bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg">
            {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
            新規撮影
            <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
          </label>
        </div>
      </div>

      {/* 履歴グリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredRecords.map((record) => (
          <div key={record.id} className="group bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all flex flex-col relative">
            
            {/* 写真エリア */}
            <div className="relative h-72 bg-slate-100 overflow-hidden">
              <img src={record.image_url} alt="Style" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                <Calendar size={14} className="text-indigo-600" />
                <span className="text-[10px] font-black text-slate-900">
                  {new Date(record.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>

              {/* クイック編集ボタン */}
              <button 
                onClick={() => setEditingImageUrl(record.image_url)}
                className="absolute bottom-6 right-6 w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              >
                <Edit3 size={20} />
              </button>
            </div>

            {/* コンテンツエリア */}
            <div className="p-8">
              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                <div className="flex items-start gap-3">
                  <FileText size={16} className="text-slate-400 mt-1 shrink-0" />
                  <p className="text-xs font-bold text-slate-600 leading-relaxed">
                    {record.note || "メモはありません。写真をタップして赤ペンで記録を追加しましょう。"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 赤ペン編集モーダル */}
      {editingImageUrl && (
        <VisualAnnotation 
          imageUrl={editingImageUrl}
          onClose={() => setEditingImageUrl(null)}
          onSave={async (blob) => {
            await handleUpload(blob, true);
          }}
        />
      )}

      {filteredRecords.length === 0 && (
        <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
          <ImageIcon size={48} className="mx-auto mb-4 text-slate-100" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Visual Records Found</p>
        </div>
      )}
    </div>
  );
};

export default ChartGallery;