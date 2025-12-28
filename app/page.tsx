"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft } from 'lucide-react';
import { Staff, Appointment, Sale, Service } from '@/types';
import { MainMenu } from '@/components/layout/MainMenu';
import { Board as TimelineBoard } from '@/components/timeline/Board';
import { PaymentModal } from '@/components/pos/PaymentModal';
import { SalesView } from '@/components/pos/SalesView';
import { AddAppointmentModal } from '@/components/timeline/AddAppointmentModal';
import { ServiceManager } from '@/components/admin/ServiceManager';
import { ChartGallery } from '@/components/charts/ChartGallery';

export default function Home() {
  const [view, setView] = useState('menu');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  const [editingApp, setEditingApp] = useState<Appointment | null>(null);
  const [activeApp, setActiveApp] = useState<Appointment | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const refreshData = async () => {
    try {
      const { data: stf } = await supabase.from('staff').select('*');
      const { data: apps } = await supabase.from('appointments').select('*, staff(name)');
      const { data: sle } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
      const { data: svc } = await supabase.from('services').select('*').order('id', { ascending: true });
      
      setStaff(stf || []);
      setAppointments(apps || []);
      setSales(sle || []);
      setServices(svc || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [view]);

  const handleSaveAppointment = async (formData: any) => {
    const start = new Date(formData.start_time);
    const selectedService = services.find(s => s.name === formData.menu_name);
    const duration = selectedService?.duration_minutes || 60;
    const end = new Date(start.getTime() + duration * 60 * 1000);

    const payload = {
      customer_name: formData.customer_name,
      staff_id: formData.staff_id,
      menu_name: formData.menu_name,
      start_time: start.toISOString(),
      end_time: end.toISOString()
    };

    if (editingApp) {
      const { error } = await supabase.from('appointments').update(payload).eq('id', editingApp.id);
      if (!error) { setEditingApp(null); await refreshData(); }
    } else {
      const { error } = await supabase.from('appointments').insert([payload]);
      if (!error) { setIsAddModalOpen(false); await refreshData(); }
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm("予約を削除しますか？")) return;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (!error) await refreshData();
  };

  const handlePaymentConfirm = async (total: number, net: number, tax: number, method: string) => {
    if (!activeApp) return;
    const { error: saleError } = await supabase.from('sales').insert([{
      appointment_id: activeApp.id,
      customer_name: activeApp.customer_name,
      staff_id: activeApp.staff_id,
      menu_name: activeApp.menu_name,
      total_amount: total,
      net_amount: net,
      tax_amount: tax,
      payment_method: method
    }]);

    if (!saleError) {
      await supabase.from('appointments').delete().eq('id', activeApp.id);
      setActiveApp(null);
      await refreshData();
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 font-sans selection:bg-indigo-500 selection:text-white">
      {view === 'menu' ? (
        <MainMenu onNavigate={setView} />
      ) : (
        <div className="min-h-screen bg-slate-50 p-4 md:p-12 rounded-t-[3rem] md:rounded-t-[4rem] shadow-2xl mt-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <button 
                onClick={() => setView('menu')} 
                className="w-fit flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-black transition-all group px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100"
              >
                <ChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Dashboard
              </button>
              <div className="text-right">
                <h2 className="text-5xl font-black italic tracking-tighter text-slate-900 uppercase">
                  {view} <span className="text-indigo-600">.</span>
                </h2>
              </div>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {view === 'calendar' && (
                <TimelineBoard 
                  staff={staff} 
                  appointments={appointments} 
                  onAdd={() => setIsAddModalOpen(true)} 
                  onPay={(app) => setActiveApp(app)}
                  onEdit={(app) => setEditingApp(app)}
                  onDelete={handleDeleteAppointment}
                  onRefresh={refreshData}
                />
              )}
              {view === 'sales' && <SalesView sales={sales} />}
              {/* 下記2つのエラーをコンポーネント側で直します */}
              {view === 'settings' && <ServiceManager services={services} onRefresh={refreshData} />}
              {view === 'chart' && <ChartGallery appointments={appointments} />}
            </div>
            
            {(isAddModalOpen || editingApp) && (
              <AddAppointmentModal 
                staff={staff} 
                services={services}
                initialData={editingApp} // nullを許容するようにModal側を直します
                onClose={() => {
                  setIsAddModalOpen(false);
                  setEditingApp(null);
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
          </div>
        </div>
      )}
    </main>
  );
}