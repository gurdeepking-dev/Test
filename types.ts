
export interface StyleTemplate {
  id: string;
  name: string;
  imageUrl: string;
  prompt: string;
  description: string;
  autoGenerate?: boolean;
  displayOrder?: number;
  created_at?: string;
}

export interface ApiKeyRecord {
  id: string;
  key: string;
  label: string;
  status: 'active' | 'exhausted' | 'invalid';
  addedAt: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
}

export interface PaymentConfig {
  gateway: 'Razorpay';
  keyId: string;
  keySecret: string;
  currency: string;
  enabled: boolean;
  photoPrice: number;
}

export interface TrackingConfig {
  metaPixelId?: string;
}

export interface AdminSettings {
  passwordHash: string;
  username: string;
  payment: PaymentConfig;
  tracking: TrackingConfig;
  geminiApiKey?: string;
  geminiApiKeys?: ApiKeyRecord[];
  coupons?: Coupon[];
}

export interface CartItem {
  id: string;
  styledImage: string;
  styleName: string;
  price: number;
}

export interface User {
  email: string;
  isLoggedIn: boolean;
}

export interface TransactionRecord {
  id?: string;
  razorpay_payment_id: string;
  user_email: string;
  amount: number;
  items: string[];
  status: 'success' | 'failed';
  created_at?: string;
}

export interface UserActivity {
  id?: string;
  event_name: string;
  event_data?: any;
  session_id: string;
  created_at?: string;
}

export type ViewType = 'home' | 'admin' | 'about' | 'contact';
