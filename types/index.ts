export interface Staff {
  id: string;
  name: string;
  role?: string;
  created_at?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  price_student?: number;
  price_child?: number;
  duration_minutes: number;
  tax_rate: number;
}

export interface Appointment {
  id: string;
  customer_name: string;
  staff_id: string;
  menu_name: string;
  start_time: string;
  end_time: string;
  staff?: { name: string };
}

export interface Sale {
  id: string;
  appointment_id?: string;
  customer_name: string; 
  staff_id: string;
  menu_name: string;     
  total_amount: number;
  net_amount: number;
  tax_amount: number;
  payment_method: string;
  created_at: string;
}

// 物品・店販用の型
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  tax_rate: number;
  category?: string;
  created_at?: string;
}

// エラーが出ていたカルテ（チャート）用の型
export interface CustomerChart {
  id: string;
  customer_name: string;
  memo: string;
  image_url?: string;
  created_at: string;
  appointment_id?: string;
}