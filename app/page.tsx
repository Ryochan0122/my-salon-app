"use client";
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft } from 'lucide-react';
import { Staff, Appointment, Sale, Service, Product } from '@/types';
import { MainMenu } from '@/components/layout/MainMenu';
import { Board as TimelineBoard } from '@/components/timeline/Board';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { SalesView } from '@/components/pos/SalesView';
import { AddAppointmentModal } from '@/components/timeline/AddAppointmentModal';
import { ServiceManager } from '@/components/admin/ServiceManager';
import { ChartGallery } from '@/components/charts/ChartGallery';
import { CustomerHistoryModal } from '@/components/customer/CustomerHistoryModal';
import { CustomerManager } from '@/components/admin/CustomerManager'; // 👈 追加

export default function Home() {
  const [view, setView] = useState('menu');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);
  const [activeApp, setActiveApp] = useState<Appointment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      const [
        { data: stf },
        { data: apps },
        { data: sle },
        { data: svc }
      ] = await Promise.all([
        supabase.from('staff').select('*'),
        supabase.from('appointments').select('*, staff(name)'),
        supabase.from('sales').select('*, staff(name)').order('created_at', { ascending: false }),
        supabase.from('services').select('*').order('id', { ascending: true })
      ]);
      
      setStaff(stf || []);
      setAppointments(apps || []);
      setSales(sle || []);
      setServices(svc || []);
    } catch (err) {
      console.error("データ取得エラー:", err);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [view, refreshData]);

  // 👈 顧客登録・紐付けロジックを強化した保存関数
  const handleSaveAppointment = async (formData: any) => {
    try {
      let customerId = formData.customer_id;

      // 1. 新規顧客フラグがある、またはIDがない場合はcustomersテーブルに登録
      if (!customerId && formData.customer_name) {
        const { data: newCust, error: custError } = await supabase
          .from('customers')
          .insert([{
            name: formData.customer_name,
            tel: formData.customer_tel,
            gender: formData.customer_gender,
            birth_date: formData.customer_birth_date || null,
            address: formData.customer_address
          }])
          .select()
          .single();
        
        if (custError) throw custError;
        customerId = newCust.id;
      }

      // 2. 予約の保存
      const start = new Date(formData.start_time);
      const selectedService = services.find(s => s.name === formData.menu_name);
      const duration = selectedService?.duration_minutes || 60;
      const end = new Date(start.getTime() + duration * 60 * 1000);

      const payload = {
        customer_id: customerId, // IDを保持
        customer_name: formData.customer_name,
        staff_id: formData.staff_id,
        menu_name: formData.menu_name,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      };

      if (editingApp) {
        const { error } = await supabase.from('appointments').update(payload).eq('id', editingApp.id);
        if (error) throw error;
        setEditingApp(null);
      } else {
        const { error } = await supabase.from('appointments').insert([payload]);
        if (error) throw error;
        setIsAddModalOpen(false);
      }
      await refreshData();
    } catch (error: any) {
      console.error("保存エラー:", error);
      alert(`保存失敗: ${error.message}`);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    const isConfirmed = window.confirm("この予約を取り消してよろしいですか？");
    if (!isConfirmed) return;
    try {
      await supabase.from('appointments').delete().eq('id', id);
      await refreshData();
    } catch (error) {
      console.error("削除エラー:", error);
    }
  };

  const handlePaymentConfirm = async (
    total: number, 
    net: number, 
    tax: number, 
    method: string, 
    cart: any[], 
    memo: string
  ) => {
    if (!activeApp) return;
    try {
      // 1. 売上登録 (customer_idを継承)
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert([{
          appointment_id: activeApp.id,
          customer_id: activeApp.customer_id, // 👈 重要
          customer_name: activeApp.customer_name,
          staff_id: activeApp.staff_id,
          menu_name: activeApp.menu_name,
          total_amount: total,
          net_amount: net,
          tax_amount: tax,
          payment_method: method,
          memo: memo 
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      // 2. 明細登録
      const saleItems = cart.map(item => ({
        sale_id: saleData.id,
        item_name: item.name,
        price: item.price,
        quantity: item.qty,
        item_type: item.type
      }));

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems);
      if (itemsError) throw itemsError;

      // 3. 在庫更新
      for (const item of cart.filter(i => i.type === 'product')) {
        const { data: pData } = await supabase.from('products').select('stock').eq('id', item.id).single();
        if (pData) {
          await supabase.from('products').update({ stock: Math.max(0, pData.stock - item.qty) }).eq('id', item.id);
        }
      }

      // 4. 予約の削除
      await supabase.from('appointments').delete().eq('id', activeApp.id);
      
      setActiveApp(null);
      await refreshData();
      alert("会計が正常に完了しました。");
    } catch (error: any) {
      console.error("会計エラー:", error);
      alert(`会計失敗: ${error.message}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
      {view === 'menu' ? (
        <MainMenu onNavigate={setView} />
      ) : (
        <div className="min-h-screen bg-slate-50 p-4 md:p-12 rounded-t-[3rem] md:rounded-t-[4rem] shadow-2xl mt-4">
          <div className="max-w-7xl mx-auto">
            {/* ナビゲーション */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <button onClick={() => setView('menu')} className="w-fit flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black transition-all group px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                <ChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Dashboard
              </button>
              <div className="text-right">
                <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 uppercase">
                  {view} <span className="text-indigo-600">.</span>
                </h2>
              </div>
            </div>

            {/* 各ビューの描画 */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {view === 'calendar' && (
                <TimelineBoard 
                  staff={staff} appointments={appointments} 
                  onAdd={() => setIsAddModalOpen(true)} 
                  onPay={(app) => setActiveApp(app)}
                  onEdit={(app) => setEditingApp(app)}
                  onDelete={handleDeleteAppointment}
                  onShowChart={(name) => setSelectedCustomer(name)}
                  onRefresh={refreshData}
                />
              )}
              {view === 'sales' && <SalesView sales={sales} />}
              {view === 'customers' && <CustomerManager />} {/* 👈 追加 */}
              {view === 'settings' && <ServiceManager services={services} onRefresh={refreshData} />}
              {view === 'chart' && <ChartGallery appointments={appointments} />}
            </div>
            
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
                onClose={() => setActiveApp(null)} 
                onConfirm={handlePaymentConfirm} 
              />
            )}

            {selectedCustomer && (
              <CustomerHistoryModal 
                customerName={selectedCustomer}
                history={sales.filter(s => s.customer_name === selectedCustomer)}
                onClose={() => setSelectedCustomer(null)}
              />
            )}
          </div>
        </div>
      )}
    </main>
  );
}