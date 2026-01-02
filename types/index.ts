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

// 👈 customer_id を追加
export interface Appointment {
  id: string;
  customer_id?: string;    // 追加：顧客マスタとの紐付け用
  customer_name: string;
  staff_id: string;
  menu_name: string;
  start_time: string;
  end_time: string;
  staff?: { name: string };
}

// 👈 customer_id と memo を追加
export interface Sale {
  id: string;
  customer_id?: string;    // 追加：どの顧客の売上か
  appointment_id?: string;
  customer_name: string; 
  staff_id: string;
  menu_name: string;     
  total_amount: number;
  net_amount: number;
  tax_amount: number;
  payment_method: string;
  memo?: string;           // 追加：施術メモ（カラー配合など）
  created_at: string;
  staff?: { name: string };
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  tax_rate: number;
  category?: string;
  created_at?: string;
}

// 👈 顧客マスタ自体の型も定義しておくと管理画面（CustomerManager）で役立ちます
export interface Customer {
  id: string;
  name: string;
  kana?: string;
  tel?: string;
  email?: string;
  gender?: string;
  birth_date?: string;
  address?: string;
  memo?: string;
  created_at: string;
}

export interface CustomerChart {
  id: string;
  customer_id?: string;    // 追加
  customer_name: string;
  memo: string;
  image_url?: string;
  created_at: string;
  appointment_id?: string;
}