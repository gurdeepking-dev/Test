
import { StyleTemplate, AdminSettings, TransactionRecord, ApiKeyRecord, Coupon } from '../types';
import { logger } from './logger';
import { supabase } from './supabase';
import { imageStorage } from './imageStorage';

const SESSION_KEY = 'styleswap_admin_session';
const INITIALIZED_KEY = 'styleswap_db_initialized';
const STYLES_CACHE_KEY = 'styleswap_styles_cache_v1';

export const DEFAULT_STYLES: StyleTemplate[] = [
  { 
    id: 'valentine-love', 
    name: 'Eternal Romance', 
    imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80', 
    prompt: 'A romantic fine art photo with a soft dreamy glow, surrounded by floating red and pink rose petals, elegant lighting, warm color palette, professional photography, ethereal atmosphere. Preserve facial identity perfectly.', 
    description: 'Perfect for Valentine gifts.',
    displayOrder: 1
  },
  { 
    id: 'viking-sikh', 
    name: 'Sikh Warrior Viking', 
    imageUrl: 'https://images.unsplash.com/photo-1519074063912-ad2dbf50b16d?w=800&q=80', 
    prompt: 'A majestic Sikh warrior in Viking chieftain attire, wearing a traditional turban with ceremonial accents, thick beard, heavy fur cloak with silver brooches, leather armor, standing in a snowy misty forest, hyper-realistic, historical epic cinematic style.', 
    description: 'Norse-Sikh fusion warrior.',
    displayOrder: 2
  },
  { id: '1', name: 'Royal Indian Wedding', imageUrl: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80', prompt: 'A magnificent Indian wedding photo. Traditional royal attire with intricate gold embroidery, heavy jewelry, and a palace background. Warm cinematic lighting.', description: 'Traditional elegance.', displayOrder: 3 },
  { id: '2', name: 'Cyberpunk Neon', imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80', prompt: 'Cyberpunk 2077 style. Neon glowing accents, futuristic techwear, rainy night city background with teal and pink lighting. High-tech aesthetic.', description: 'Futuristic sci-fi.', displayOrder: 4 },
  { id: '3', name: 'Pixar Animation', imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80', prompt: '3D Disney Pixar animation style. Big expressive eyes, smooth skin textures, stylized features, vibrant and soft cinematic lighting.', description: '3D Animated character.', displayOrder: 5 },
  { id: '4', name: 'Greek Marble Statue', imageUrl: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&q=80', prompt: 'Classic white marble Greek sculpture. Intricate carved details, smooth stone texture, museum gallery lighting, timeless museum aesthetic.', description: 'Ancient masterpiece.', displayOrder: 6 },
  { id: '10', name: 'Studio Ghibli Anime', imageUrl: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80', prompt: 'Hand-painted Studio Ghibli anime style. Soft watercolor textures, whimsical atmosphere, lush green background, gentle lighting.', description: 'Japanese animation.', displayOrder: 7 }
];

export const DEFAULT_ADMIN: AdminSettings = {
  username: 'admin',
  passwordHash: 'admin123',
  geminiApiKeys: [],
  coupons: [],
  payment: {
    gateway: 'Razorpay',
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    currency: process.env.DEFAULT_CURRENCY || 'INR',
    enabled: true,
    photoPrice: parseFloat(process.env.PHOTO_PRICE || '8')
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
        .order('displayOrder', { ascending: true })
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      if ((!data || data.length === 0) && !localStorage.getItem(INITIALIZED_KEY)) {
        localStorage.setItem(INITIALIZED_KEY, 'true');
        await Promise.all(DEFAULT_STYLES.map(s => this.saveStyle(s)));
        return DEFAULT_STYLES;
      }

      const styles = data || [];
      if (styles.length > 0) {
        localStorage.setItem(STYLES_CACHE_KEY, JSON.stringify(styles));
      }
      return styles;
    } catch (err) {
      return DEFAULT_STYLES;
    }
  },

  async saveStyle(style: StyleTemplate): Promise<void> {
    const finalImageUrl = await imageStorage.uploadTemplateImage(style.imageUrl);
    const { error } = await supabase.from('styles').upsert({
      ...style,
      imageUrl: finalImageUrl,
      displayOrder: style.displayOrder || 0,
      autoGenerate: style.autoGenerate || false,
      created_at: style.created_at || new Date().toISOString()
    });
    if (error) throw error;
    localStorage.removeItem(STYLES_CACHE_KEY);
  },

  async deleteStyle(id: string): Promise<void> {
    try {
      const response = await supabase.from('styles').delete().eq('id', id);
      if (response.error) throw response.error;
      localStorage.removeItem(STYLES_CACHE_KEY);
    } catch (err: any) {
      throw err;
    }
  },

  async importStyles(stylesJson: string): Promise<void> {
    const parsed = JSON.parse(stylesJson);
    if (Array.isArray(parsed)) {
      await Promise.all(parsed.map(s => this.saveStyle(s)));
      localStorage.removeItem(STYLES_CACHE_KEY);
    }
  },

  async exportStyles(): Promise<string> {
    const styles = await this.getStyles(true);
    return JSON.stringify(styles, null, 2);
  },

  async getAdminSettings(): Promise<AdminSettings> {
    try {
      const { data, error } = await supabase.from('settings').select('config').eq('id', 'global').single();
      
      if (error || !data) {
        await this.saveAdminSettings(DEFAULT_ADMIN);
        return DEFAULT_ADMIN;
      }
      
      const settings = data.config as AdminSettings;
      
      if (!settings.tracking) settings.tracking = { metaPixelId: '' };
      if (!settings.coupons) settings.coupons = [];

      if (settings.geminiApiKey && (!settings.geminiApiKeys || settings.geminiApiKeys.length === 0)) {
        settings.geminiApiKeys = [{
          id: 'legacy-key',
          key: settings.geminiApiKey,
          label: 'Default Key',
          status: 'active',
          addedAt: Date.now()
        }];
      }
      
      return settings;
    } catch (err) {
      return DEFAULT_ADMIN;
    }
  },

  async saveAdminSettings(settings: AdminSettings): Promise<void> {
    const { error } = await supabase.from('settings').upsert({
      id: 'global',
      config: settings
    });
    if (error) {
      logger.error('Storage', 'Failed to save settings', error);
      throw error;
    }
  },

  isAdminLoggedIn(): boolean {
    return localStorage.getItem(SESSION_KEY) === 'true';
  },

  setAdminLoggedIn(val: boolean): void {
    if (val) localStorage.setItem(SESSION_KEY, 'true');
    else localStorage.removeItem(SESSION_KEY);
  },

  async saveTransaction(tx: TransactionRecord): Promise<void> {
    const { error } = await supabase.from('transactions').insert({
      razorpay_payment_id: tx.razorpay_payment_id,
      user_email: tx.user_email,
      amount: tx.amount,
      items: tx.items,
      status: tx.status,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  async logActivity(eventName: string, eventData: any = {}): Promise<void> {
    const sessionId = localStorage.getItem('styleswap_session_id') || Math.random().toString(36).substring(7);
    localStorage.setItem('styleswap_session_id', sessionId);

    try {
      await supabase.from('user_activities').insert({
        event_name: eventName,
        event_data: eventData,
        session_id: sessionId,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      // Quiet fail to not interrupt user flow
      console.debug('Activity logging failed', err);
    }
  },

  getCurrencySymbol(currency: string = 'INR'): string {
    const symbols: Record<string, string> = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'INR': '₹' };
    return symbols[currency] || '₹';
  }
};
