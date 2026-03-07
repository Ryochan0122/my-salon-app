"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ChevronLeft, Loader2, LogOut, UserPlus, 
  TrendingUp, Zap, Sparkles, Info
} from 'lucide-react';
import { Staff, Appointment, Sale, Service } from '@/types';

import { MainMenu } from '@/components/layout/MainMenu';
import { Board as TimelineBoard } from '@/components/timeline/Board';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { SalesView } from '@/components/pos/SalesView';
import { AddAppointmentModal } from '@/components/timeline/AddAppointmentModal';
import { ServiceManager } from '@/components/admin/ServiceManager';
import { ChartGallery } from '@/components/charts/ChartGallery';
import { CustomerHistoryModal } from '@/components/customer/CustomerHistoryModal';
import { CustomerManager } from '@/components/admin/CustomerManager';
import { AuthView } from '@/components/auth/AuthView';

const EmptyState = ({ title, desc, icon: Icon, action, label, secondaryAction }: any) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 animate-in fade-in zoom-in duration-500">
    <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6">
      <Icon size={36} />
    </div>
    <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase italic tracking-tight">{title}</h3>
    <p className="text-slate-400 font-bold text-sm mb-8 text-center max-w-xs leading-relaxed">{desc}</p>
    <div className="flex flex-col gap-4 w-full max-w-[240px]">
      <button
        onClick={action}
        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:scale-105 transition-all active:scale-95"
      >
        {label}
      </button>
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  </div>
);

const SHOP_ID_KEY = 'aura_shop_id';
const USER_ID_KEY = 'aura_user_id';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [view, setView] = useState('menu');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const shopIdRef = useRef<string | null>(null);

  const [editingApp, setEditingApp] = useState<any>(null);
  const [activeApp, setActiveApp] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [addModalInitialData, setAddModalInitialData] = useState<{ staffId?: string; date?: Date; time?: string } | null>(null);

  const getShopId = () => shopIdRef.current || localStorage.getItem(SHOP_ID_KEY);

  const fetchAllData = async (shopId: string) => {
    try {
      const [stf, apps, sle, svc] = await Promise.all([
        supabase.from('staff').select('*').eq('shop_id', shopId),
        supabase.from('appointments').select('*').eq('shop_id', shopId),
        supabase.from('sales').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }),
        supabase.from('services').select('*').eq('shop_id', shopId).order('id', { ascending: true })
      ]);
      setStaff(stf.data || []);
      setAppointments(apps.data || []);
      setSales(sle.data || []);
      setServices(svc.data || []);
    } catch (err) {
      console.error('fetchAllData Error:', err);
    }
  };

  const refreshData = async () => {
    const shopId = getShopId();
    if (!shopId) return;
    await fetchAllData(shopId);
  };

  const initFromUserId = async (userId: string) => {
    try {
      const cachedShopId = localStorage.getItem(SHOP_ID_KEY);
      const cachedUserId = localStorage.getItem(USER_ID_KEY);

      if (cachedShopId && cachedUserId === userId) {
        console.log('✅ キャッシュから復元:', cachedShopId);
        shopIdRef.current = cachedShopId;
        await fetchAllData(cachedShopId);
        setIsLoggedIn(true);
      } else {
        console.log('🔍 DBから取得:', userId);
        const { data, error } = await supabase
          .from('profiles')
          .select('shop_id')
          .eq('id', userId)
          .single();

        if (error || !data?.shop_id) {
          console.error('❌ profiles取得失敗:', error);
          return;
        }

        const shopId = data.shop_id as string;
        shopIdRef.current = shopId;
        localStorage.setItem(SHOP_ID_KEY, shopId);
        localStorage.setItem(USER_ID_KEY, userId);
        await fetchAllData(shopId);
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error('initFromUserId Error:', e);
    } finally {
      console.log('🏁 setInitialized(true) 呼ばれた');
      setInitialized(true);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔥 AUTH EVENT:', event, session?.user?.id);

      if (session?.user) {
        setInitialized(false);
        await initFromUserId(session.user.id);
      } else {
        localStorage.removeItem(SHOP_ID_KEY);
        localStorage.removeItem(USER_ID_KEY);
        shopIdRef.current = null;
        setStaff([]);
        setAppointments([]);
        setSales([]);
        setServices([]);
        setIsLoggedIn(false);
        setInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem(SHOP_ID_KEY);
    localStorage.removeItem(USER_ID_KEY);
    shopIdRef.current = null;
    await supabase.auth.signOut();
  };

  const handlePayClick = (app: any) => {
    const appDate = new Date(app.start_time);
    const today = new Date();
    const isToday =
      appDate.getFullYear() === today.getFullYear() &&
      appDate.getMonth() === today.getMonth() &&
      appDate.getDate() === today.getDate();
    if (!isToday) {
      const dateStr = `${appDate.getMonth() + 1}月${appDate.getDate()}日`;
      if (!confirm(`この予約は${dateStr}の予約です。本日会計しますか？`)) return;
    }
    setActiveApp(app);
  };

  const handleMoveAppointment = async (appointmentId: string, newStaffId: string, newStartTime: string) => {
    const shopId = getShopId();
    if (!shopId) return;
    try {
      const targetApp = appointments.find((a: any) => a.id === appointmentId);
      if (!targetApp) return;
      const durationMs = new Date(targetApp.end_time).getTime() - new Date(targetApp.start_time).getTime();
      const start = new Date(newStartTime);
      const end = new Date(start.getTime() + durationMs);
      const { error } = await supabase
        .from('appointments')
        .update({ staff_id: newStaffId, start_time: start.toISOString(), end_time: end.toISOString(), shop_id: shopId })
        .eq('id', appointmentId)
        .eq('shop_id', shopId);
      if (error) throw error;
      await refreshData();
    } catch (error: any) {
      alert(`移動失敗: ${error.message}`);
    }
  };

  const handleSaveAppointment = async (formData: any) => {
    const shopId = getShopId();
    if (!shopId) return;
    try {
      let customerId = formData.customer_id;
      if (!customerId && formData.customer_name) {
        const { data: newCust, error: custError } = await supabase
          .from('customers')
          .insert([{ shop_id: shopId, name: formData.customer_name, tel: formData.customer_tel || '', gender: formData.customer_gender || 'female' }])
          .select().single();
        if (custError) throw custError;
        customerId = newCust.id;
      }
      const start = new Date(formData.start_time);
      const selectedService = services.find((s: any) => s.name === formData.menu_name);
      const duration = (selectedService as any)?.duration_minutes || 60;
      const end = new Date(start.getTime() + duration * 60 * 1000);
      const payload = {
        shop_id: shopId,
        customer_id: customerId,
        customer_name: formData.customer_name,
        staff_id: formData.staff_id,
        menu_name: formData.menu_name,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      };
      if (editingApp) {
        await supabase.from('appointments').update(payload).eq('id', editingApp.id).eq('shop_id', shopId);
        setEditingApp(null);
      } else {
        await supabase.from('appointments').insert([payload]);
        setIsAddModalOpen(false);
      }
      setAddModalInitialData(null);
      await refreshData();
    } catch (error: any) {
      alert(`保存失敗: ${error.message}`);
    }
  };

  const handlePaymentConfirm = async (total: number, net: number, tax: number, method: string, cart: any[], memo: string) => {
    const shopId = getShopId();
    if (!activeApp || !shopId) return;
    try {
      const { error: saleError } = await supabase
        .from('sales')
        .insert([{
          shop_id: shopId,
          appointment_id: activeApp.id,
          customer_id: activeApp.customer_id,
          customer_name: activeApp.customer_name,
          staff_id: activeApp.staff_id,
          menu_name: activeApp.menu_name,
          total_amount: total,
          net_amount: net,
          tax_amount: tax,
          payment_method: method,
          memo: memo
        }]);
      if (saleError) throw saleError;
      const productItems = cart.filter(i => i.type === 'product');
      for (const item of productItems) {
        const { data: pData } = await supabase.from('inventory').select('stock').eq('name', item.name).eq('shop_id', shopId).single();
        if (pData) {
          await supabase.from('inventory').update({ stock: Math.max(0, pData.stock - item.qty) }).eq('name', item.name).eq('shop_id', shopId);
        }
      }
      await supabase.from('appointments').delete().eq('id', activeApp.id).eq('shop_id', shopId);
      setActiveApp(null);
      await refreshData();
      alert('お会計が完了しました。');
    } catch (error: any) {
      alert(`会計エラー: ${error.message}`);
    }
  };

  const handleRevertSale = async (sale: Sale) => {
    const shopId = getShopId();
    if (!shopId) return;
    if (!confirm(`${sale.customer_name}様の会計（¥${sale.total_amount.toLocaleString()}）を取り消しますか？\n\n予約がタイムラインに戻ります。`)) return;
    try {
      const { error: deleteError } = await supabase.from('sales').delete().eq('id', sale.id).eq('shop_id', shopId);
      if (deleteError) throw deleteError;
      const matchedService = services.find((s: any) => s.name === sale.menu_name);
      const durationMin = (matchedService as any)?.duration_minutes || 60;
      const restoredStart = new Date(sale.created_at);
      const restoredEnd = new Date(restoredStart.getTime() + durationMin * 60 * 1000);
      const { error: insertError } = await supabase.from('appointments').insert([{
        shop_id: shopId,
        customer_id: sale.customer_id || null,
        customer_name: sale.customer_name,
        staff_id: sale.staff_id,
        menu_name: sale.menu_name,
        start_time: restoredStart.toISOString(),
        end_time: restoredEnd.toISOString(),
      }]);
      if (insertError) throw insertError;
      await refreshData();
      alert('会計を取り消しました。予約がタイムラインに戻りました。');
    } catch (error: any) {
      alert(`取り消しエラー: ${error.message}`);
    }
  };

  const handleAddAtTime = (staffId: string, date: Date, time: string) => {
    setAddModalInitialData({ staffId, date, time });
    setIsAddModalOpen(true);
  };

  if (!initialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-400" size={40} />
          <p className="text-white/30 font-black uppercase text-[10px] tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) return <AuthView />;

  const viewLabels: { [key: string]: string } = {
    calendar: '予約スケジュール',
    sales: '売上履歴',
    customers: '顧客・ビジュアルカルテ',
    settings: 'マスタ設定',
    chart: '経営分析'
  };

  return (
    <main className="min-h-screen bg-slate-950 font-sans">
      {view === 'menu' ? (
        <div className="relative">
          {(staff.length === 0 || services.length === 0) && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md animate-in slide-in-from-top-4 duration-700">
              <div className="bg-indigo-600 text-white p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.4)] flex items-center gap-4 border border-white/20">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <Sparkles size={24} className="animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">Step 1: Setup</p>
                  <p className="text-sm font-bold tracking-tight">スタッフとメニューを登録して、最初の予約を受け付けましょう！</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="absolute top-8 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 text-white/50 hover:text-white hover:bg-white/20 rounded-xl transition-all font-bold text-[10px] uppercase tracking-[0.2em] border border-white/5"
          >
            <LogOut size={14} /> Sign Out
          </button>
          <MainMenu onNavigate={setView} />
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 p-4 md:p-12 rounded-t-[3.5rem] shadow-2xl mt-4 relative animate-in slide-in-from-bottom-10 duration-500">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <button
                onClick={() => setView('menu')}
                className="w-fit flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black transition-all group px-5 py-3 bg-white rounded-2xl shadow-sm border border-slate-100"
              >
                <ChevronLeft className="group-hover:-translate-x-1 transition-transform" /> BACK TO MENU
              </button>
              <div className="text-right">
                <h2 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">
                  {viewLabels[view] || view} <span className="text-indigo-600">.</span>
                </h2>
              </div>
            </div>

            {view === 'settings' && (
              <div className="mb-8 flex items-center gap-3 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-in fade-in duration-1000">
                <Info className="text-indigo-600" size={20} />
                <p className="text-indigo-900 text-xs font-bold leading-relaxed">
                  スタッフ・メニュー情報をここで事前に設定すると、予約時に選択肢として自動表示されます。会計時にも自動連携されます。
                </p>
              </div>
            )}

            <div className="animate-in fade-in duration-700">
              {view === 'calendar' && (
                staff.length === 0 ? (
                  <EmptyState
                    title="No Staff Registered"
                    desc="予約を管理するにはスタッフの登録が必要です。まずは「設定」からスタッフを追加しましょう。"
                    icon={UserPlus}
                    label="スタッフを登録する"
                    action={() => setView('settings')}
                  />
                ) : (
                  <TimelineBoard
                    staff={staff}
                    appointments={appointments}
                    sales={sales}
                    services={services}
                    onAdd={() => setIsAddModalOpen(true)}
                    onPay={handlePayClick}
                    onEdit={setEditingApp}
                    onDelete={(id: string) => {
                      supabase.from('appointments').delete().eq('id', id).eq('shop_id', getShopId()).then(() => refreshData());
                    }}
                    onMove={handleMoveAppointment}
                    onRefresh={refreshData}
                    onShowChart={setSelectedCustomer}
                    onAddAtTime={handleAddAtTime}
                  />
                )
              )}

              {view === 'sales' && (
                sales.length === 0 ? (
                  <div className="space-y-6">
                    <div className="p-8 bg-white rounded-[3rem] opacity-20 grayscale pointer-events-none border border-slate-100">
                      <div className="h-40 flex items-end justify-between gap-3 px-10">
                        {[40, 80, 60, 95, 50, 75, 90, 60, 80].map((h, i) => (
                          <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-indigo-200 rounded-t-xl" />
                        ))}
                      </div>
                    </div>
                    <EmptyState
                      title="Sales History Empty"
                      desc="お会計が完了すると、ここに自動で売上レポートと入金履歴が生成されます。最初の予約をカレンダーに入れましょう。"
                      icon={TrendingUp}
                      label="カレンダーを開く"
                      action={() => setView('calendar')}
                      secondaryAction={{ label: 'デモを詳しく見る', onClick: () => alert('チュートリアル準備中') }}
                    />
                  </div>
                ) : (
                  <SalesView sales={sales} onRevert={handleRevertSale} />
                )
              )}

              {view === 'customers' && <CustomerManager />}
              {view === 'settings' && <ServiceManager services={services} onRefresh={refreshData} />}
              {view === 'chart' && (
                appointments.length === 0 && sales.length === 0 ? (
                  <EmptyState
                    title="Analyzing Your Success"
                    desc="データが不足しています。数件の予約と会計が完了すると、AIによる来店予測や失客リスク分析が始まります。"
                    icon={Zap}
                    label="予約状況を確認"
                    action={() => setView('calendar')}
                  />
                ) : (
                  <ChartGallery appointments={appointments} />
                )
              )}
            </div>
          </div>
        </div>
      )}

      {(isAddModalOpen || editingApp) && (
        <AddAppointmentModal
          staff={staff}
          services={services}
          initialData={editingApp}
          defaultStaffId={addModalInitialData?.staffId}
          defaultDate={addModalInitialData?.date?.toISOString().split('T')[0]}
          defaultTime={addModalInitialData?.time}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingApp(null);
            setAddModalInitialData(null);
          }}
          onConfirm={handleSaveAppointment}
        />
      )}
      {activeApp && (
        <PaymentModal
          app={activeApp}
          services={services}
          onClose={() => setActiveApp(null)}
          onConfirm={handlePaymentConfirm}
        />
      )}
      {selectedCustomer && (
        <CustomerHistoryModal
          customerName={selectedCustomer}
          history={sales.filter((s: any) => s.customer_name === selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </main>
  );
}