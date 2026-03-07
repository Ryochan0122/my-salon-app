"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Phone, MapPin, Calendar, 
  Trash2, UserCheck, X, Plus, Zap, Camera, Image as ImageIcon, Loader2, Users, Clock, History,
  UserPlus, Heart, AlertCircle, Upload
} from 'lucide-react';

type FilterType = 'all' | 'followup' | 'vip';

interface InputGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const CustomerManager = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSales, setCustomerSales] = useState<any[]>([]);
  const [visualPhotos, setVisualPhotos] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', kana: '', tel: '', address: '', gender: 'female' });
  const [activeTab, setActiveTab] = useState<'history' | 'photos'>('history');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const shopId = localStorage.getItem('aura_shop_id');
    if (!shopId) return;
    setLoading(true);
    try {
      const { data: cData } = await supabase.from('customers').select('*').eq('shop_id', shopId).order('name', { ascending: true });
      const { data: sData } = await supabase.from('sales').select('*').eq('shop_id', shopId).order('created_at', { ascending: false });
      setCustomers(cData || []);
      setAllSales(sData || []);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer);
    setActiveTab('history');
    const shopId = localStorage.getItem('aura_shop_id');
    
    const { data: salesData } = await supabase
      .from('sales')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
    setCustomerSales(salesData || []);

    const { data: photoData } = await supabase
      .from('visual_history')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    setVisualPhotos(photoData || []);
  };

  // 会計履歴への写真アップロード
  const handleSalePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, saleId: string) => {
    const file = e.target.files?.[0];
    const shopId = localStorage.getItem('aura_shop_id');
    if (!file || !shopId) return;
    setIsUploading(saleId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}/${selectedCustomer.id}/sale_${saleId}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('customer-photos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('customer-photos').getPublicUrl(fileName);
      await supabase.from('sales').update({ image_url: publicUrl }).eq('id', saleId).eq('shop_id', shopId);
      handleSelectCustomer(selectedCustomer);
    } catch (error: any) {
      alert("アップロードに失敗しました: " + error.message);
    } finally {
      setIsUploading(null);
    }
  };

  // 自由写真のアップロード（visual_historyテーブルへ）
  const handleFreePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const shopId = localStorage.getItem('aura_shop_id');
    if (!file || !shopId || !selectedCustomer) return;
    setIsUploading('free');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}/${selectedCustomer.id}/free_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('customer-photos').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('customer-photos').getPublicUrl(fileName);
      await supabase.from('visual_history').insert([{
        shop_id: shopId,
        customer_id: selectedCustomer.id,
        image_url: publicUrl,
        storage_path: fileName,
        note: ''
      }]);
      handleSelectCustomer(selectedCustomer);
    } catch (error: any) {
      alert("アップロードに失敗しました: " + error.message);
    } finally {
      setIsUploading(null);
    }
  };

  const handleDeletePhoto = async (photo: any) => {
    if (!confirm('この写真を削除しますか？')) return;
    try {
      if (photo.storage_path) {
        await supabase.storage.from('customer-photos').remove([photo.storage_path]);
      }
      await supabase.from('visual_history').delete().eq('id', photo.id);
      setVisualPhotos(prev => prev.filter(p => p.id !== photo.id));
    } catch (error: any) {
      alert("削除に失敗しました: " + error.message);
    }
  };

  const handleAddCustomer = async () => {
    const shopId = localStorage.getItem('aura_shop_id');
    if (!newCustomer.name || !shopId) return alert("お名前を入力してください");
    const { error } = await supabase.from('customers').insert([{ ...newCustomer, shop_id: shopId }]);
    if (!error) {
      setNewCustomer({ name: '', kana: '', tel: '', address: '', gender: 'female' });
      setShowAddModal(false);
      fetchData();
    }
  };

  const deleteCustomer = async (id: string) => {
    const shopId = localStorage.getItem('aura_shop_id');
    if (!shopId || !confirm('顧客情報を削除しますか？')) return;
    await supabase.from('appointments').delete().eq('customer_id', id).eq('shop_id', shopId);
    await supabase.from('sales').delete().eq('customer_id', id).eq('shop_id', shopId);
    await supabase.from('visual_history').delete().eq('customer_id', id);
    await supabase.from('customers').delete().eq('id', id).eq('shop_id', shopId);
    setSelectedCustomer(null);
    fetchData();
  };

  const analyzedCustomers = useMemo(() => {
    return customers.map(c => {
      const cSales = allSales.filter(s => s.customer_id === c.id);
      const lastVisitDate = cSales.length > 0 ? new Date(cSales[0].created_at) : new Date(c.created_at);
      const diffDays = Math.floor((new Date().getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
      let avgCycle = 0;
      if (cSales.length >= 2) {
        const totalDays = Math.floor((new Date(cSales[0].created_at).getTime() - new Date(cSales[cSales.length-1].created_at).getTime()) / (1000 * 60 * 60 * 24));
        avgCycle = Math.floor(totalDays / (cSales.length - 1));
      }
      const totalSpent = cSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const visitCount = cSales.length;
      const isVIP = visitCount >= 10 || totalSpent >= 100000;
      const isPredict = avgCycle > 0 && diffDays > (avgCycle + 7) && diffDays < 90;
      const isRisk = diffDays > 45 && diffDays < 90;
      const needsFollowup = isPredict || isRisk;
      return { ...c, visitCount, lastVisitDays: diffDays, totalSpent, isVIP, needsFollowup, isPredict };
    });
  }, [customers, allSales]);

  const filteredCustomers = useMemo(() => {
    return analyzedCustomers.filter(c => {
      const query = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || c.name.toLowerCase().includes(query) || c.kana?.includes(query) || c.tel?.includes(query);
      const matchFilter = filter === 'vip' ? c.isVIP : filter === 'followup' ? c.needsFollowup : true;
      return matchSearch && matchFilter;
    });
  }, [analyzedCustomers, filter, searchQuery]);

  if (!loading && customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8"><UserPlus size={40} /></div>
        <h2 className="text-3xl font-black italic text-slate-900 mb-4 uppercase tracking-tighter">No Clients Found</h2>
        <p className="text-slate-400 font-bold text-sm mb-10 text-center max-w-sm leading-relaxed">顧客データがまだありません。最初の顧客を登録しましょう。</p>
        <button onClick={() => setShowAddModal(true)} className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:scale-105 transition-all active:scale-95 flex items-center gap-3">
          <Plus size={18} /> 新規顧客を登録する
        </button>
      </div>
    );
  }

  const analyzed = analyzedCustomers.find(ac => ac.id === selectedCustomer?.id);

  return (
    <div className="flex flex-col gap-6 h-[85vh] animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter text-slate-900">AURA <span className="text-indigo-600">CLIENTS</span></h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Smart Visual CRM</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
          <Plus size={14} /> 新規顧客登録
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl w-fit ml-2">
        {(['all', 'followup', 'vip'] as FilterType[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest transition-all flex items-center gap-2 ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            {f === 'followup' && <AlertCircle size={12} />}
            {f === 'vip' && <Heart size={12} className={filter === 'vip' ? "fill-rose-500 text-rose-500" : ""} />}
            {f === 'all' ? 'すべて' : f === 'followup' ? '要フォロー' : 'VIP'}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* 顧客リスト */}
        <div className="w-full md:w-96 flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="名前・電話番号で検索..." className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl shadow-sm font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none border-none transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto bg-white rounded-[2.5rem] shadow-sm p-3 space-y-1 border border-slate-50 custom-scrollbar">
            {filteredCustomers.map(c => (
              <button key={c.id} onClick={() => handleSelectCustomer(c)} className={`w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between ${selectedCustomer?.id === c.id ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'hover:bg-slate-50 text-slate-600'}`}>
                <div className="min-w-0">
                  <div className="font-black text-sm flex items-center gap-2 truncate">
                    {c.name} 様
                    {c.isVIP && <Heart size={10} className="text-rose-500 fill-rose-500" />}
                    {c.isPredict && <Zap size={10} className="text-indigo-400 animate-pulse" />}
                  </div>
                  <div className="text-[9px] font-bold opacity-50 truncate">{c.tel || '電話番号なし'}</div>
                </div>
                {selectedCustomer?.id === c.id ? <UserCheck size={16} className="text-indigo-400" /> : c.needsFollowup && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* 詳細パネル */}
        <div className="flex-1 bg-white rounded-[3.5rem] shadow-sm overflow-hidden flex flex-col border border-slate-50">
          {selectedCustomer ? (
            <div className="flex flex-col h-full">
              {/* 顧客ヘッダー */}
              <div className="p-8 bg-slate-50 border-b relative shrink-0">
                <button onClick={() => deleteCustomer(selectedCustomer.id)} className="absolute right-8 top-8 p-3 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18}/></button>
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-2xl font-black text-white shadow-xl">{selectedCustomer.name[0]}</div>
                  <div>
                    <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">{selectedCustomer.name} 様</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">{selectedCustomer.kana || 'カナ未登録'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <InfoBox label="電話番号" value={selectedCustomer.tel || '---'} icon={<Phone size={10}/>} />
                  <InfoBox label="来店回数" value={`${analyzed?.visitCount || 0}回`} icon={<Calendar size={10}/>} />
                  <InfoBox label="累計金額" value={`¥${(analyzed?.totalSpent || 0).toLocaleString()}`} icon={<MapPin size={10}/>} />
                  <InfoBox label="前回から" value={`${analyzed?.lastVisitDays || 0}日`} icon={<Clock size={10}/>} />
                </div>
              </div>

              {/* タブ */}
              <div className="flex border-b border-slate-100 shrink-0">
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>
                  <History size={14} /> 施術履歴
                </button>
                <button onClick={() => setActiveTab('photos')} className={`flex-1 py-4 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'photos' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>
                  <Camera size={14} /> ビジュアルカルテ
                  {visualPhotos.length > 0 && <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full text-[9px]">{visualPhotos.length}</span>}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* 施術履歴タブ */}
                {activeTab === 'history' && (
                  <div className="p-8 space-y-8">
                    <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-0 before:w-px before:bg-slate-100">
                      {customerSales.length === 0 && (
                        <div className="text-center py-16 text-slate-300">
                          <History size={32} className="mx-auto mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-widest">施術履歴なし</p>
                        </div>
                      )}
                      {customerSales.map((sale, idx) => (
                        <div key={sale.id} className="group relative flex gap-6">
                          <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400 z-10 shrink-0">{customerSales.length - idx}</div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="text-[11px] font-black text-indigo-600 uppercase block">{sale.menu_name}</span>
                                <span className="text-[10px] font-bold text-slate-400">{new Date(sale.created_at).toLocaleDateString('ja-JP')}</span>
                              </div>
                              <span className="text-sm font-black italic text-slate-900">¥{sale.total_amount?.toLocaleString()}</span>
                            </div>
                            <div className="flex gap-4">
                              <div className="relative w-44 h-44 rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 group/photo shadow-inner">
                                {sale.image_url ? (
                                  <>
                                    <img src={sale.image_url} alt="カルテ写真" className="w-full h-full object-cover transition-transform group-hover/photo:scale-110 duration-700" />
                                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                                      <Camera size={20} className="mb-1" />
                                      <span className="text-[9px] font-black tracking-widest uppercase">変更</span>
                                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSalePhotoUpload(e, sale.id)} />
                                    </label>
                                  </>
                                ) : (
                                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                                    {isUploading === sale.id ? <Loader2 size={24} className="text-indigo-500 animate-spin" /> : <><ImageIcon size={24} className="text-slate-300 mb-1" /><span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">写真を追加</span></>}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSalePhotoUpload(e, sale.id)} />
                                  </label>
                                )}
                              </div>
                              <div className="flex-1 bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Note</p>
                                <p className="text-xs font-bold text-slate-600 leading-relaxed italic">{sale.memo || "施術メモはありません。"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ビジュアルカルテタブ */}
                {activeTab === 'photos' && (
                  <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">自由に写真を追加できます</p>
                      <label className="cursor-pointer bg-slate-900 hover:bg-indigo-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black transition-all flex items-center gap-2 shadow-lg active:scale-95">
                        {isUploading === 'free' ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        写真を追加
                        <input type="file" accept="image/*" className="hidden" onChange={handleFreePhotoUpload} disabled={isUploading === 'free'} />
                      </label>
                    </div>

                    {visualPhotos.length === 0 ? (
                      <div className="py-24 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-200">
                        <Camera size={40} strokeWidth={1} className="mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">写真がまだありません</p>
                        <p className="text-[9px] font-bold mt-2 opacity-60">上のボタンから追加してください</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {visualPhotos.map((photo) => (
                          <div key={photo.id} className="group relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-slate-100">
                            <img src={photo.image_url} alt="visual" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                              <span className="text-[9px] text-white font-black">{new Date(photo.created_at).toLocaleDateString('ja-JP')}</span>
                              <button onClick={() => handleDeletePhoto(photo)} className="mt-2 p-2 bg-rose-500/80 text-white rounded-xl w-fit hover:bg-rose-600 transition-all">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-200 p-12 text-center">
              <Users size={48} className="opacity-10 mb-6" />
              <p className="text-[11px] font-black uppercase tracking-[0.4em] mb-2">Select a Client</p>
              <p className="text-[9px] font-bold opacity-40 max-w-[220px]">顧客を選択すると詳細を表示します</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <div className="flex justify-between mb-10">
              <h3 className="text-3xl font-black italic tracking-tighter uppercase">Registration</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <InputGroup label="お名前" value={newCustomer.name} onChange={(v) => setNewCustomer({...newCustomer, name: v})} placeholder="山田 太郎" />
              <InputGroup label="フリガナ" value={newCustomer.kana} onChange={(v) => setNewCustomer({...newCustomer, kana: v})} placeholder="ヤマダ タロウ" />
              <InputGroup label="電話番号" value={newCustomer.tel} onChange={(v) => setNewCustomer({...newCustomer, tel: v})} placeholder="090-0000-0000" />
              <InputGroup label="住所" value={newCustomer.address} onChange={(v) => setNewCustomer({...newCustomer, address: v})} placeholder="東京都..." />
            </div>
            <button onClick={handleAddCustomer} className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-2xl flex items-center justify-center gap-2 group">
              プロフィール作成 <Plus size={16} className="group-hover:rotate-90 transition-transform"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const InputGroup = ({ label, value, onChange, placeholder }: InputGroupProps) => (
  <div className="space-y-2 group">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest group-focus-within:text-indigo-500 transition-colors">{label}</label>
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm outline-none transition-all" />
  </div>
);

const InfoBox = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 hover:border-indigo-100 transition-colors truncate">
    <div className="flex items-center gap-1.5 opacity-40">{icon}<p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</p></div>
    <p className="text-xs font-bold text-slate-800 truncate">{value}</p>
  </div>
);