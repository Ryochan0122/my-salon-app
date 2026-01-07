"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Plus, Camera, FileText, Calendar, 
  MoreVertical, History, Image as ImageIcon, Loader2 
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
    setLoading(true);
    // SQLスキーマに合わせて visual_history と customers を結合
    const { data, error } = await supabase
      .from('visual_history')
      .select(`
        *,
        customers (
          name
        )
      `)
      .order('created_at', { ascending: false });
    
    if (!error) setCharts(data || []);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, recordId: string, customerId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(recordId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${customerId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('customer-photos') // バケット名を統一
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('customer-photos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('visual_history')
        .update({ image_url: publicUrl })
        .eq('id', recordId);

      if (updateError) throw updateError;
      fetchCharts();
    } catch (error) {
      console.error('Upload Error:', error);
      alert('失敗しました。');
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
            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      {/* グリッド表示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCharts.map((chart) => (
          <div key={chart.id} className="group bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all flex flex-col relative">
            
            <div className="relative h-72 bg-slate-100 overflow-hidden">
              <img src={chart.image_url} alt="施術写真" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm z-10">
                <Calendar size={14} className="text-indigo-600" />
                <span className="text-[10px] font-black text-slate-900">{new Date(chart.created_at).toLocaleDateString()}</span>
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
                  </div>
                </div>
              </div>

              <div className="flex-1 bg-slate-50 rounded-[2rem] p-6 mb-8 border border-slate-100">
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  {chart.note || "施術メモはありません。"}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <label className="cursor-pointer flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                  <Camera size={18} />
                  <span>写真を差し替え</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, chart.id, chart.customer_id)} />
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};