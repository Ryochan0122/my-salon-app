"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CustomerChart } from '@/types';
import { 
  Search, 
  Plus, 
  Camera, 
  FileText, 
  Calendar, 
  User,
  MoreVertical,
  History,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';

export const ChartList = () => {
  const [charts, setCharts] = useState<CustomerChart[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCharts();
  }, []);

  const fetchCharts = async () => {
    const { data, error } = await supabase
      .from('customer_charts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setCharts(data || []);
    setLoading(false);
  };

  // 【100機能：写真アップロード & DB更新】
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, chartId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(chartId);

    try {
      // 1. Storageへのパス設定 (chartsバケット内にchart-photosフォルダを作成)
      const fileExt = file.name.split('.').pop();
      const fileName = `${chartId}-${Date.now()}.${fileExt}`;
      const filePath = `chart-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('charts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. 公開URLの取得
      const { data: { publicUrl } } = supabase.storage
        .from('charts')
        .getPublicUrl(filePath);

      // 3. DBのimage_urlを更新
      const { error: updateError } = await supabase
        .from('customer_charts')
        .update({ image_url: publicUrl })
        .eq('id', chartId);

      if (updateError) throw updateError;

      fetchCharts(); // データをリフレッシュ
    } catch (error) {
      console.error('Upload Error:', error);
      alert('アップロードに失敗しました。');
    } finally {
      setUploadingId(null);
    }
  };

  // 検索フィルタリング
  const filteredCharts = charts.filter(chart => 
    chart.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chart.memo && chart.memo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* 検索・アクションバー */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="お客様名、またはメモで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
        </div>
        
        <button className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl">
          <Plus size={20} />
          <span>NEW CHART</span>
        </button>
      </div>

      {/* カルテグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCharts.map((chart) => (
          <div key={chart.id} className="group bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all flex flex-col relative">
            
            {/* 写真エリア */}
            <div className="relative h-72 bg-slate-100 overflow-hidden">
              {chart.image_url ? (
                <img src={chart.image_url} alt="Visit record" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                  <ImageIcon size={48} strokeWidth={1} />
                  <span className="text-[10px] font-black uppercase tracking-widest">No Image Recorded</span>
                </div>
              )}

              {/* アップロード中のローディング */}
              {uploadingId === chart.id && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white gap-2">
                  <Loader2 size={32} className="animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Uploading...</span>
                </div>
              )}

              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                <Calendar size={14} className="text-indigo-600" />
                <span className="text-[10px] font-black text-slate-900">
                  {new Date(chart.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>

            {/* コンテンツエリア */}
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                    {chart.customer_name[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-slate-900 tracking-tighter">{chart.customer_name}</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visit History</p>
                  </div>
                </div>
                <button className="p-2 text-slate-200 hover:text-slate-900 transition-colors"><MoreVertical size={20}/></button>
              </div>

              <div className="flex-1 bg-slate-50 rounded-[2rem] p-6 mb-8 border border-slate-100">
                <div className="flex items-start gap-3">
                  <FileText size={16} className="text-slate-400 mt-1 shrink-0" />
                  <p className="text-xs font-bold text-slate-600 leading-relaxed line-clamp-4">
                    {chart.memo || "メモはありません。"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto">
                <label className="cursor-pointer group/btn flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                  <Camera size={18} />
                  <span>Update Photo</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, chart.id)} 
                  />
                </label>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                  <History size={14} /> Full History
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* 空の状態 */}
        {filteredCharts.length === 0 && !loading && (
          <div className="col-span-full py-32 text-center bg-white rounded-[4rem] border border-dashed border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic">No Charts Found</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Start recording client visit history.</p>
          </div>
        )}
      </div>
    </div>
  );
};