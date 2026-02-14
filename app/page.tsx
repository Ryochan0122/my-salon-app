"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Loader2, LogOut } from 'lucide-react';
import { Staff, Appointment, Sale, Service } from '@/types';

// Components
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

export default function Home() {
  // --- 状態管理 ---
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState('menu');
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);
  const [activeApp, setActiveApp] = useState<Appointment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  // --- 1. 認証 & 初期化ロジック ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) syncShopId(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) syncShopId(session.user.id);
      else localStorage.removeItem('aura_shop_id');
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncShopId = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('shop_id')
      .eq('id', userId)
      .single();
    if (data?.shop_id) {
      localStorage.setItem('aura_shop_id', data.shop_id);
      refreshData();
    }
  };

  const getShopId = () => localStorage.getItem('aura_shop_id');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('aura_shop_id');
    setSession(null);
  };

  // --- 2. データ取得 (refreshData) ---
  const refreshData = useCallback(async () => {
    const shopId = getShopId();
    if (!shopId) return;

    setLoading(true);
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
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) refreshData();
  }, [view, refreshData, session]);

  // --- 3. 業務ロジック (ドラッグ移動・保存・会計) ---
  const handleMoveAppointment = async (appointmentId: string, newStaffId: string, newStartTime: string) => {
    const shopId = getShopId();
    if (!shopId) return;

    try {
      const targetApp = appointments.find(a => a.id === appointmentId);
      if (!targetApp) return;

      const durationMs = new Date(targetApp.end_time).getTime() - new Date(targetApp.start_time).getTime();
      const start = new Date(newStartTime);
      const end = new Date(start.getTime() + durationMs);

      const { error } = await supabase
        .from('appointments')
        .update({
          staff_id: newStaffId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          shop_id: shopId
        })
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
          .insert([{
            shop_id: shopId,
            name: formData.customer_name,
            tel: formData.customer_tel || '',
            gender: formData.customer_gender || 'female'
          }])
          .select().single();
        if (custError) throw custError;
        customerId = newCust.id;
      }

      const start = new Date(formData.start_time);
      const selectedService = services.find(s => s.name === formData.menu_name);
      const duration = selectedService?.duration_minutes || 60;
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
      await refreshData();
    } catch (error: any) {
      alert(`保存失敗: ${error.message}`);
    }
  };

  const handlePaymentConfirm = async (total: number, net: number, tax: number, method: string, cart: any[], memo: string) => {
    const shopId = getShopId();
    if (!activeApp || !shopId) return;

    try {
      const { data: saleData, error: saleError } = await supabase
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
        }])
        .select().single();

      if (saleError) throw saleError;

      const saleItems = cart.map(item => ({
        shop_id: shopId,
        sale_id: saleData.id,
        item_name: item.name,
        price: item.price,
        quantity: item.qty || 1,
        item_type: item.type || 'service'
      }));

      await supabase.from('sale_items').insert(saleItems);

      // 在庫減算ロジック
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
      alert("お会計が完了しました。");
    } catch (error: any) {
      alert(`会計エラー: ${error.message}`);
    }
  };

  // --- 4. 表示制御 ---
  if (!session) return <AuthView />;

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
          <button 
            onClick={handleLogout}
            className="absolute top-8 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 text-white/50 hover:text-white hover:bg-white/20 rounded-xl transition-all font-bold text-[10px] uppercase tracking-[0.2em]"
          >
            <LogOut size={14} /> Sign Out
          </button>
          <MainMenu onNavigate={setView} />
        </div>
      ) : (
        <div className="min-h-screen bg-slate-50 p-4 md:p-12 rounded-t-[3rem] shadow-2xl mt-4 relative animate-in slide-in-from-bottom-10 duration-500">
          {loading && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-50 flex items-center justify-center rounded-t-[3rem]">
              <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
          )}

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

            <div className="animate-in fade-in duration-700">
              {view === 'calendar' && (
                <TimelineBoard 
                  staff={staff} appointments={appointments} 
                  onAdd={() => setIsAddModalOpen(true)} onPay={setActiveApp}
                  onEdit={setEditingApp} onDelete={(id) => {
                    if(confirm("予約を削除しますか？")) supabase.from('appointments').delete().eq('id', id).eq('shop_id', getShopId()).then(() => refreshData());
                  }}
                  onMove={handleMoveAppointment} onRefresh={refreshData}
                  onShowChart={setSelectedCustomer}
                />
              )}
              {view === 'sales' && <SalesView sales={sales} />}
              {view === 'customers' && <CustomerManager />}
              {view === 'settings' && <ServiceManager services={services} onRefresh={refreshData} />}
              {view === 'chart' && <ChartGallery appointments={appointments} />}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {(isAddModalOpen || editingApp) && (
        <AddAppointmentModal 
          staff={staff} services={services} initialData={editingApp} 
          onClose={() => { setIsAddModalOpen(false); setEditingApp(null); }} 
          onConfirm={handleSaveAppointment} 
        />
      )}
      {activeApp && (
        <PaymentModal 
          app={activeApp} services={services} 
          onClose={() => setActiveApp(null)} onConfirm={handlePaymentConfirm} 
        />
      )}
      {selectedCustomer && (
        <CustomerHistoryModal 
          customerName={selectedCustomer}
          history={sales.filter(s => s.customer_name === selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </main>
  );
}