"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, FileUp, Phone, MapPin, Calendar, 
  History, MessageSquare, Trash2, User, UserCheck, X, Star, Clock, Moon, Users 
} from 'lucide-react';

type FilterType = 'all' | 'vip' | 'risk' | 'dormant';

export const CustomerManager = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]); // 分析用に全売上を保持
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerSales, setCustomerSales] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  // 1. 顧客一覧と分析用売上データを取得
  useEffect(() => {
    fetchData();
  }, [searchQuery]);

  const fetchData = async () => {
    // 顧客取得
    let query = supabase.from('customers').select('*').order('name', { ascending: true });
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,tel.ilike.%${searchQuery}%,kana.ilike.%${searchQuery}%`);
    }
    const { data: cData } = await query;
    
    // 全売上取得（セグメント判定用）
    const { data: sData } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
    
    setCustomers(cData || []);
    setAllSales(sData || []);
  };

  // 2. 顧客を選択した時に履歴を読み込む (customer_id で正確に紐付け)
  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer);
    const { data } = await supabase
      .from('sales')
      .select('*, staff(name)')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });
    setCustomerSales(data || []);
  };

  // CSVインポート (既存ロジックを完全維持)
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').slice(1);
      const newCustomers = rows.map(row => {
        const columns = row.split(',');
        return { 
          name: columns[0]?.trim(), 
          kana: columns[1]?.trim(), 
          tel: columns[2]?.trim(), 
          address: columns[3]?.trim(), 
          birth_date: columns[4]?.trim() || null, 
          gender: columns[5]?.trim() || 'female' 
        };
      }).filter(c => c.name);
      const { error } = await supabase.from('customers').insert(newCustomers);
      if (!error) {
        alert(`${newCustomers.length}件登録しました`);
        fetchData();
      }
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  // 削除ロジック (子データから消す安全な手順を完全維持)
  const deleteCustomer = async (id: string) => {
    const isConfirmed = confirm('このお客様を完全に削除しますか？\n関連する全ての来店履歴、売上データ、予約情報も同時に削除されます。');
    if (!isConfirmed) return;

    try {
      await supabase.from('appointments').delete().eq('customer_id', id);
      await supabase.from('sales').delete().eq('customer_id', id);
      const { error: custError } = await supabase.from('customers').delete().eq('id', id);

      if (custError) throw custError;
      setSelectedCustomer(null);
      fetchData();
      alert("顧客データを完全に消去しました。");
    } catch (err: any) {
      alert("削除に失敗しました: " + err.message);
    }
  };

  // --- AURA Intelligence: 顧客分析ロジック ---
  const analyzedCustomers = customers.map(c => {
    const cSales = allSales.filter(s => s.customer_id === c.id);
    const lastVisitDate = cSales.length > 0 ? new Date(cSales[0].created_at) : new Date(c.created_at);
    const diffDays = Math.floor((new Date().getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      ...c,
      visitCount: cSales.length,
      lastVisitDays: diffDays,
      totalSpent: cSales.reduce((sum, s) => sum + s.total_amount, 0),
    };
  });

  const filteredCustomers = analyzedCustomers.filter(c => {
    if (filter === 'vip') return c.visitCount >= 10 || c.totalSpent >= 100000;
    if (filter === 'risk') return c.lastVisitDays > 45 && c.lastVisitDays <= 90;
    if (filter === 'dormant') return c.lastVisitDays > 90;
    return true;
  });

  return (
    <div className="flex flex-col gap-6 h-[85vh] animate-in fade-in duration-500">
      {/* AURA Header */}
      <div className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter text-slate-900">AURA <span className="text-indigo-600">CLIENTS</span></h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Customer intelligence & history</p>
        </div>
        <div className="flex gap-2">
           <label className="flex items-center gap-2 px-4 py-2 bg-white text-slate-500 rounded-xl font-black text-[10px] cursor-pointer hover:bg-slate-50 transition-all border border-slate-100 shadow-sm">
            <FileUp size={14} /> <span>{isImporting ? 'IMPORTING...' : 'CSV IMPORT'}</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
          </label>
        </div>
      </div>

      {/* Segment Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit ml-2">
        {[
          { id: 'all', label: 'ALL', icon: <Users size={12}/> },
          { id: 'vip', label: 'VIP', icon: <Star size={12}/> },
          { id: 'risk', label: 'RISK', icon: <Clock size={12}/> },
          { id: 'dormant', label: 'DORMANT', icon: <Moon size={12}/> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as FilterType)}
            className={`px-6 py-2 rounded-xl font-black text-[10px] tracking-widest flex items-center gap-2 transition-all
              ${filter === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* 左：名簿リスト */}
        <div className="w-full md:w-96 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" placeholder="Search by name, kana, or tel..."
              className="w-full pl-11 pr-4 py-4 bg-white rounded-2xl border-none shadow-sm font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto bg-white rounded-[2.5rem] shadow-sm p-3 space-y-1 custom-scrollbar border border-slate-50">
            {filteredCustomers.map(c => (
              <button 
                key={c.id} onClick={() => handleSelectCustomer(c)}
                className={`w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between group relative overflow-hidden ${selectedCustomer?.id === c.id ? 'bg-slate-900 text-white shadow-xl translate-x-1' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                <div className="truncate relative z-10">
                  <div className="font-black text-sm flex items-center gap-2">
                    {c.name}
                    {c.visitCount >= 10 && <Star size={10} className="text-amber-400 fill-amber-400" />}
                  </div>
                  <div className={`text-[9px] font-bold ${selectedCustomer?.id === c.id ? 'text-slate-400' : 'text-slate-300'}`}>{c.tel || 'No Phone'}</div>
                </div>
                
                {/* 休眠インジケーター */}
                {c.lastVisitDays > 90 && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />}
                {selectedCustomer?.id === c.id && <UserCheck size={16} className="text-indigo-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* 右：詳細・履歴 */}
        <div className="flex-1 bg-white rounded-[3.5rem] shadow-sm overflow-hidden flex flex-col border border-slate-50">
          {selectedCustomer ? (
            <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
              {/* Profile Header */}
              <div className="p-10 bg-slate-50 border-b border-slate-100 relative">
                <button 
                  onClick={() => deleteCustomer(selectedCustomer.id)} 
                  className="absolute right-10 top-10 p-4 bg-white text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all shadow-sm border border-slate-100"
                >
                  <Trash2 size={20} />
                </button>
                
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-indigo-200">
                    {selectedCustomer.name[0]}
                  </div>
                  <div>
                    <h3 className="text-4xl font-black italic tracking-tighter text-slate-900 mb-1">{selectedCustomer.name}</h3>
                    <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.3em]">{selectedCustomer.kana || 'No Kana Record'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <InfoBox label="Phone" value={selectedCustomer.tel} icon={<Phone size={10}/>} />
                  <InfoBox label="Birth" value={selectedCustomer.birth_date} icon={<Calendar size={10}/>} />
                  <InfoBox label="Address" value={selectedCustomer.address} icon={<MapPin size={10}/>} />
                  <InfoBox label="Gender" value={selectedCustomer.gender} icon={<User size={10}/>} />
                </div>
              </div>

              {/* History Timeline */}
              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar bg-white">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 text-slate-400">
                    <History size={18} /> 
                    <span className="text-[11px] font-black uppercase tracking-widest">Customer Timeline</span>
                  </div>
                  <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full">
                    Total: {customerSales.length} visits
                  </div>
                </div>

                <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-0 before:w-px before:bg-slate-100">
                  {customerSales.length > 0 ? customerSales.map((sale, idx) => (
                    <div key={sale.id} className="flex gap-8 relative">
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400 shrink-0 z-10 group-hover:border-indigo-500 transition-all">
                        {customerSales.length - idx}
                      </div>
                      <div className="flex-1 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter block mb-1">{sale.menu_name}</span>
                            <span className="text-[10px] font-bold text-slate-400">{new Date(sale.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <span className="text-sm font-black text-slate-900 italic">¥{sale.total_amount?.toLocaleString()}</span>
                        </div>
                        {sale.memo ? (
                          <div className="bg-white p-4 rounded-xl border border-slate-50 shadow-sm">
                            <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                              <MessageSquare size={12} className="inline mr-2 opacity-20" />
                              {sale.memo}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-300 italic ml-2">No treatment notes for this session.</p>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-24 opacity-20">
                      <History size={48} className="mx-auto mb-4" />
                      <p className="text-[11px] font-black uppercase tracking-[0.3em]">History Empty</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-200 bg-slate-50/30">
              <div className="w-32 h-32 bg-white rounded-[3rem] shadow-sm flex items-center justify-center mb-6">
                <Users size={48} className="opacity-5" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.4em] animate-pulse">Select an aura profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoBox = ({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 hover:border-indigo-100 transition-colors">
    <div className="flex items-center gap-1.5 opacity-40">
      {icon}
      <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-xs font-bold text-slate-800 truncate">{value || '---'}</p>
  </div>
);