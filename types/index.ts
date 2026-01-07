export interface Shop {
  id: string;
  name: string;
  created_at: string;
}

export interface Staff {
  id: string;
  shop_id: string; // 👈 追加
  name: string;
  role?: string;
  created_at?: string;
}

export interface Service {
  id: string;
  shop_id: string; // 👈 追加
  name: string;
  price: number;
  price_student?: number;
  price_child?: number;
  duration_minutes: number;
  tax_rate: number;
}

export interface Appointment {
  id: string;
  shop_id: string; // 👈 追加
  customer_id?: string;
  customer_name: string;
  staff_id: string;
  menu_name: string;
  start_time: string;
  end_time: string;
  status?: 'confirmed' | 'completed' | 'cancelled';
  staff?: { name: string };
}

export interface Sale {
  id: string;
  shop_id: string; // 👈 追加
  customer_id?: string;
  appointment_id?: string;
  customer_name: string; 
  staff_id: string;
  menu_name: string;     
  total_amount: number;
  net_amount: number;
  tax_amount: number;
  payment_method: string;
  memo?: string;
  created_at: string;
  staff?: { name: string };
}

export interface Product {
  id: string;
  shop_id: string; // 👈 追加
  name: string;
  price: number;
  stock: number;
  tax_rate: number;
  category?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  shop_id: string; // 👈 追加
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

// SQLのテーブル名 visual_history に合わせるのがベストです
export interface VisualHistory {
  id: string;
  shop_id: string; // 👈 追加
  customer_id: string;
  appointment_id?: string;
  image_url: string;
  note?: string;
  created_at: string;
}