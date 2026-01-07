"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Phone, MapPin, Calendar, 
  Trash2, UserCheck, X, Plus, Zap, Camera, Image as ImageIcon, Loader2, Users, Clock, History
} from 'lucide-react';

type FilterType = 'all' | 'vip' | 'risk' | 'dormant' | 'predict';

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
  const [filter, setFilter] = useState<FilterType>('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', kana: '', tel: '', address: '', gender: 'female' });

  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const fetchData = async () => {
    let query = supabase.from('customers').select('*').order('name', { ascending: true });
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,tel.ilike.%${searchQuery}%,kana.ilike.%${searchQuery}%`);
    }
    const { data: cData } = await query;
    const { data: sData } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    
    setCustomers(cData || []);
    setAllSales(sData || []);
  };

  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer);
    const { data } = await supabase
      .from('sales')
      .select('*, staff(name)')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    setCustomerSales(data || []);
  };

  // ビジュアルカルテ：写真アップロード
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, saleId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(saleId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedCustomer.id}/${saleId}_${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('customer-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('customer-photos')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('sales')
        .update({ image_url: publicUrl })
        .eq('id', saleId);

      if (updateError) throw updateError;
      
      handleSelectCustomer(selectedCustomer);
    } catch (error: any) {
      alert("アップロードに失敗しました: " + error.message);
    } finally {
      setIsUploading(null);
    }
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name) return alert("お名前を入力してください");
    const { error } = await supabase.from('customers').insert([newCustomer]);
    if (!error) {
      setNewCustomer({ name: '', kana: '', tel: '', address: '', gender: 'female' });
      setShowAddModal(false);
      fetchData();
    }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('顧客情報を削除しますか？\n全ての来店履歴と画像も閲覧できなくなります。')) return;
    await supabase.from('appointments').delete().eq('customer_id', id);
    await supabase.from('sales').delete().eq('customer_id', id);
    await supabase.from('customers').delete().eq('id', id);
    setSelectedCustomer(null);
    fetchData();
  };

  // 来店予測・分析ロジック (AIサジェストの基礎データ)
  const analyzedCustomers = customers.map(c => {
    const cSales = allSales.filter(s => s.customer_id === c.id);
    const lastVisitDate = cSales.length > 0 ? new Date(cSales[0].created_at) : new Date(c.created_at);
    const diffDays = Math.floor((new Date().getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
    let avgCycle = 0;
    if (cSales.length >= 2) {
      const totalDays = Math.floor((new Date(cSales[0].created_at).getTime() - new Date(cSales[cSales.length-1].created_at).getTime()) / (1000 * 60 * 60 * 24));
      avgCycle = Math.floor(totalDays / (cSales.length - 1));
    }
    return {
      ...c,
      visitCount: cSales.length,
      lastVisitDays: diffDays,
      totalSpent: cSales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      isPredict: avgCycle > 0 && diffDays > (avgCycle + 14) && diffDays < 90
    };
  });

  const filteredCustomers = analyzedCustomers.filter(c => {
    if (filter === 'vip') return c.visitCount >= 10 || c.totalSpent >= 100000;
    if (filter === 'risk') return c.lastVisitDays > 45 && c.lastVisitDays <= 90;
    if (filter === 'dormant') return c.lastVisitDays > 90;
    if (filter === 'predict') return c.isPredict;
    return true;
  });

  const filterLabels = {
    all: 'すべて',
    predict: '来店予測',
    vip: 'VIP顧客',
    risk: '失客リスク',
    dormant: '休眠顧客'
  };

  return (
    <div className="flex flex-col gap-6 h-[85vh] animate-in fade-in duration-500 relative">
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter text-slate-900">AURA <span className="text-indigo-600">CLIENTS</span></h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Visual & Predictive Intelligence</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
          <Plus size={14} /> <span>新規顧客登録</span>
        </button>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit ml-2">
        {Object.entries(filterLabels).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id as FilterType)} className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest transition-all ${filter === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* 左側：顧客リスト */}
        <div className="w-full md:w-96 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="名前・電話番号で検索..." className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl shadow-sm font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none border-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto bg-white rounded-[2.5rem] shadow-sm p-3 space-y-1 border border-slate-50 custom-scrollbar">
            {filteredCustomers.map(c => (
              <button key={c.id} onClick={() => handleSelectCustomer(c)} className={`w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between ${selectedCustomer?.id === c.id ? 'bg-slate-900 text-white shadow-xl' : 'hover:bg-slate-50 text-slate-600'}`}>
                <div>
                  <div className="font-black text-sm flex items-center gap-2">
                    {c.name} 様 {c.isPredict && <Zap size={10} className="text-indigo-400 fill-indigo-400 animate-pulse" />}
                  </div>
                  <div className="text-[9px] font-bold opacity-50">{c.tel || '電話番号なし'}</div>
                </div>
                {selectedCustomer?.id === c.id && <UserCheck size={16} className="text-indigo-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* 右側：詳細・ビジュアルカルテ */}
        <div className="flex-1 bg-white rounded-[3.5rem] shadow-sm overflow-hidden flex flex-col border border-slate-50">
          {selectedCustomer ? (
            <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
              <div className="p-10 bg-slate-50 border-b relative">
                <button onClick={() => deleteCustomer(selectedCustomer.id)} className="absolute right-10 top-10 p-4 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={20}/></button>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-2xl">{selectedCustomer.name[0]}</div>
                  <div>
                    <h3 className="text-4xl font-black italic tracking-tighter text-slate-900">{selectedCustomer.name} 様</h3>
                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">{selectedCustomer.kana}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoBox label="電話番号" value={selectedCustomer.tel} icon={<Phone size={10}/>} />
                  <InfoBox label="誕生日" value={selectedCustomer.birth_date} icon={<Calendar size={10}/>} />
                  <InfoBox label="住所" value={selectedCustomer.address} icon={<MapPin size={10}/>} />
                  <InfoBox label="最終来店" value={`${analyzedCustomers.find(ac => ac.id === selectedCustomer.id)?.lastVisitDays}日前`} icon={<Clock size={10}/>} />
                </div>
              </div>

              {/* ビジュアルタイムライン */}
              <div className="p-10 space-y-8">
                <div className="flex items-center gap-2 text-slate-400 mb-4 font-black text-[11px] uppercase tracking-widest">
                  <Camera size={18} /> Visual Chart History
                </div>
                
                <div className="space-y-12 relative before:absolute before:left-[15px] before:top-2 before:bottom-0 before:w-px before:bg-slate-100">
                  {customerSales.map((sale, idx) => (
                    <div key={sale.id} className="group relative flex gap-8">
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400 z-10 shrink-0">{customerSales.length - idx}</div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[11px] font-black text-indigo-600 uppercase block">{sale.menu_name}</span>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(sale.created_at).toLocaleDateString('ja-JP')}</span>
                          </div>
                          <span className="text-sm font-black italic text-slate-900">¥{sale.total_amount?.toLocaleString()}</span>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="relative w-full md:w-56 h-56 rounded-[2.5rem] overflow-hidden bg-slate-50 border border-slate-100 flex-shrink-0 group/photo shadow-inner">
                            {sale.image_url ? (
                              <>
                                <img src={sale.image_url} alt="カルテ写真" className="w-full h-full object-cover transition-transform group-hover/photo:scale-110 duration-700" />
                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                                  <Camera size={24} className="mb-2" />
                                  <span className="text-[9px] font-black tracking-widest uppercase">写真を変更</span>
                                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, sale.id)} />
                                </label>
                              </>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
                                {isUploading === sale.id ? (
                                  <Loader2 size={32} className="text-indigo-500 animate-spin" />
                                ) : (
                                  <>
                                    <ImageIcon size={32} className="text-slate-300 mb-2" />
                                    <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">写真を追加</span>
                                  </>
                                )}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, sale.id)} />
                              </label>
                            )}
                          </div>
                          
                          <div className="flex-1 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-2 mb-4 text-slate-400">
                              <History size={14} />
                              <span className="text-[10px] font-black uppercase tracking-widest">Service Note</span>
                            </div>
                            <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                              {sale.memo || "施術メモは登録されていません。"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-200">
              <Users size={48} className="opacity-5 mb-4" />
              <p className="text-[11px] font-black uppercase tracking-[0.4em]">顧客を選択してください</p>
            </div>
          )}
        </div>
      </div>

      {/* 登録モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <div className="flex justify-between mb-10"><h3 className="text-3xl font-black italic tracking-tighter uppercase">Registration</h3><button onClick={() => setShowAddModal(false)} className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button></div>
            <div className="space-y-6">
              <InputGroup label="お名前" value={newCustomer.name} onChange={(v: string) => setNewCustomer({...newCustomer, name: v})} placeholder="山田 太郎" />
              <InputGroup label="フリガナ" value={newCustomer.kana} onChange={(v: string) => setNewCustomer({...newCustomer, kana: v})} placeholder="ヤマダ タロウ" />
              <InputGroup label="電話番号" value={newCustomer.tel} onChange={(v: string) => setNewCustomer({...newCustomer, tel: v})} placeholder="090-0000-0000" />
              <InputGroup label="住所" value={newCustomer.address} onChange={(v: string) => setNewCustomer({...newCustomer, address: v})} placeholder="東京都渋谷区..." />
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
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 hover:border-indigo-100 transition-colors">
    <div className="flex items-center gap-1.5 opacity-40">{icon}<p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</p></div>
    <p className="text-xs font-bold text-slate-800 truncate">{value || '---'}</p>
  </div>
);