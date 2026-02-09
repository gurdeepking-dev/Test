
import { StyleTemplate, AdminSettings, TransactionRecord, ApiKeyRecord, Coupon, SampleVideo } from '../types';
import { logger } from './logger';
import { supabase } from './supabase';
import { imageStorage } from './imageStorage';

const SESSION_KEY = 'styleswap_admin_session';
const STYLES_CACHE_KEY = 'styleswap_styles_cache_v1';

export const DEFAULT_ADMIN: AdminSettings = {
  username: 'admin',
  passwordHash: 'admin123',
  geminiApiKeys: [],
  coupons: [],
  klingAccessKey: 'AdKKKaygptmMtkMee3T49HgNHLgrbdTm',
  klingSecretKey: 'pfCCfPLtQHYmRtkCHdktNHgM8p8ATaQN',
  videoSamples: [],
  payment: {
    gateway: 'Razorpay',
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    currency: process.env.DEFAULT_CURRENCY || 'INR',
    enabled: true,
    photoPrice: parseFloat(process.env.PHOTO_PRICE || '8'),
    videoBasePrice: 20
  },
  tracking: {
    metaPixelId: ''
  }
};

export const storageService = {
  async getStyles(forceRefresh = false): Promise<StyleTemplate[]> {
    const cached = localStorage.getItem(STYLES_CACHE_KEY);
    if (cached && !forceRefresh) {
      this.fetchStylesFromDB().then(freshData => {
        if (freshData.length > 0) {
          localStorage.setItem(STYLES_CACHE_KEY, JSON.stringify(freshData));
        }
      });
      return JSON.parse(cached);
    }
    return this.fetchStylesFromDB();
  },

  async fetchStylesFromDB(): Promise<StyleTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('styles')
        .select('*')
        .order('displayOrder', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      return [];
    }
  },

  async saveStyle(style: StyleTemplate): Promise<void> {
    const finalImageUrl = await imageStorage.uploadTemplateImage(style.imageUrl);
    const { error } = await supabase.from('styles').upsert({
      ...style,
      imageUrl: finalImageUrl
    });
    if (error) throw error;
    localStorage.removeItem(STYLES_CACHE_KEY);
  },

  async deleteStyle(id: string): Promise<void> {
    const { error } = await supabase.from('styles').delete().eq('id', id);
    if (error) throw error;
    localStorage.removeItem(STYLES_CACHE_KEY);
  },

  async getAdminSettings(): Promise<AdminSettings> {
    try {
      const { data, error } = await supabase.from('settings').select('config').eq('id', 'global').single();
      if (error || !data) {
        return DEFAULT_ADMIN;
      }
      // Merge with default to ensure new fields (like kling keys) aren't missing
      const dbConfig = data.config as AdminSettings;
      return {
        ...DEFAULT_ADMIN,
        ...dbConfig,
        payment: { ...DEFAULT_ADMIN.payment, ...dbConfig.payment },
        tracking: { ...DEFAULT_ADMIN.tracking, ...dbConfig.tracking }
      };
    } catch (err) {
      return DEFAULT_ADMIN;
    }
  },

  async saveAdminSettings(settings: AdminSettings): Promise<void> {
    const { error } = await supabase.from('settings').upsert({
      id: 'global',
      config: settings
    });
    if (error) throw error;
  },

  async getSampleVideos(): Promise<SampleVideo[]> {
    const settings = await this.getAdminSettings();
    return settings.videoSamples || [];
  },

  isAdminLoggedIn(): boolean {
    return localStorage.getItem(SESSION_KEY) === 'true';
  },

  setAdminLoggedIn(val: boolean): void {
    if (val) localStorage.setItem(SESSION_KEY, 'true');
    else localStorage.removeItem(SESSION_KEY);
  },

  async saveTransaction(tx: TransactionRecord): Promise<void> {
    // Fault-tolerant save
    try {
      const { error } = await supabase.from('transactions').insert(tx);
      if (error) logger.warn('Storage', 'Transaction insert warning', error);
    } catch (e) {
      logger.error('Storage', 'Transaction insert failed', e);
    }
  },

  async updateTransactionStatus(paymentId: string, status: Partial<TransactionRecord>): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update(status)
        .eq('razorpay_payment_id', paymentId);
      if (error) logger.warn('Storage', 'Transaction update warning', error);
    } catch (e) {}
  },

  async getTransactions(): Promise<TransactionRecord[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async logActivity(eventName: string, eventData: any = {}): Promise<void> {
    const sessionId = localStorage.getItem('styleswap_session_id') || Math.random().toString(36).substring(7);
    localStorage.setItem('styleswap_session_id', sessionId);
    try {
      await supabase.from('user_activities').insert({
        event_name: eventName,
        event_data: eventData,
        session_id: sessionId
      });
    } catch (err) {}
  },

  getCurrencySymbol(currency: string = 'INR'): string {
    const symbols: Record<string, string> = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹' };
    return symbols[currency] || '₹';
  }
};
