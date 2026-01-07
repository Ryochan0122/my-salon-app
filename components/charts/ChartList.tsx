"use client";
import React, { useState, useEffect } from 'react';
import { supabase, getCurrentShopId } from '@/lib/supabase';
import { 
  Search, Camera, Calendar, Image as ImageIcon, Loader2 
} from 'lucide-react';

export const ChartList = () => {
  const [charts, setCharts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCharts();
  }, []);

  const fetchCharts = async () => {
    try {
      setLoading(true);
      const shopId = await getCurrentShopId();
      if (!shopId) return;

      // SQLスキーマに合わせて visual_history と customers を結合し、shop_idで絞り込み
      const { data, error } = await supabase
        .from('visual_history')
        .select(`
          *,
          customers (
            name
          )
        `)
        .eq('shop_id', shopId) // 👈 店舗フィルタ
        .order('created_at', { ascending: false });
      
      if (!error) setCharts(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, recordId: string, customerId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(recordId);

    try {
      const shopId = await getCurrentShopId();
      if (!shopId) throw new Error("店舗IDが取得できませんでした");

      const fileExt = file.name.split('.').pop();
      // ストレージパスを shop_id/customer_id/... に統一
      const fileName = `${shopId}/${customerId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('customer-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('customer-photos')
        .getPublicUrl(fileName);

      // DBの image_url を更新。セキュリティのため shop_id も条件に加える
      const { error: updateError } = await supabase
        .from('visual_history')
        .update({ image_url: publicUrl })
        .eq('id', recordId)
        .eq('shop_id', shopId); // 👈 自分の店のデータのみ更新可能

      if (updateError) throw updateError;
      
      fetchCharts(); // 画面を更新
    } catch (error) {
      console.error('Upload Error:', error);
      alert('画像のアップロードに失敗しました。');
    } finally {
      setUploadingId(null);
    }
  };

  const filteredCharts = charts.filter(chart => 
    chart.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chart.note && chart.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* 検索バー */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="お客様名、メモで検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 text-sm text-slate-900"
          />
        </div>
      </div>

      {/* グリッド表示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCharts.map((chart) => (
          <div key={chart.id} className="group bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all flex flex-col relative">
            
            <div className="relative h-72 bg-slate-100 overflow-hidden">
              <img src={chart.image_url} alt="施術写真" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              
              {/* アップロード中のローディング表示 */}
              {uploadingId === chart.id && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-20">
                  <Loader2 className="animate-spin text-white" size={32} />
                </div>
              )}

              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm z-10">
                <Calendar size={14} className="text-indigo-600" />
                <span className="text-[10px] font-black text-slate-900">
                  {new Date(chart.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                    {chart.customers?.name?.[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-xl text-slate-900 tracking-tighter">{chart.customers?.name} 様</h4>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">VISUAL HISTORY</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-slate-50 rounded-[2rem] p-6 mb-8 border border-slate-100">
                <p className="text-xs font-bold text-slate-600 leading-relaxed line-clamp-3">
                  {chart.note || "施術メモはありません。"}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <label className="cursor-pointer group/btn flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all w-full justify-center">
                  <Camera size={18} />
                  <span>写真を差し替え</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, chart.id, chart.customer_id)} 
                  />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* データがない場合の表示 */}
      {!loading && filteredCharts.length === 0 && (
        <div className="py-32 text-center bg-white rounded-[4rem] border-4 border-dashed border-slate-50">
          <ImageIcon size={48} className="mx-auto mb-4 text-slate-100" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Visual Records Found</p>
        </div>
      )}
    </div>
  );
};