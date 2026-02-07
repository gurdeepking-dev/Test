import { storageService } from './storage';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const analytics = {
  async init() {
    const settings = await storageService.getAdminSettings();
    const pixelId = settings.tracking?.metaPixelId;

    // Strict check for valid pixelId string
    if (!pixelId || typeof pixelId !== 'string' || pixelId.trim() === '') {
      logger.debug('Analytics', 'Meta Pixel ID is missing or empty, skipping initialization.');
      return;
    }

    // Load Meta Pixel Script
    (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
      if (f.fbq) return; n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', pixelId.trim());
    window.fbq('track', 'PageView');
    
    storageService.logActivity('page_view', { pixel_active: true });
  },

  track(event: string, params: any = {}) {
    if (window.fbq) {
      window.fbq('track', event, params);
    }
    storageService.logActivity(event.toLowerCase(), params);
  }
};
import { logger } from './logger';