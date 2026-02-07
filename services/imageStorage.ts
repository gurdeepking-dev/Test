
import { supabase } from './supabase';
import { logger } from './logger';

export const imageStorage = {
  async uploadTemplateImage(base64: string): Promise<string> {
    try {
      // 1. If it's already a URL (external or cloud), return it directly
      if (!base64 || !base64.startsWith('data:')) {
        return base64;
      }

      // 2. Extract basic info
      const mimeMatch = base64.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const fileExt = mimeType.split('/')[1] || 'png';
      
      // 3. Generate a clean unique filename
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `styles/${fileName}`;

      // 4. Reliable conversion to Blob
      const response = await fetch(base64);
      const blob = await response.blob();

      // 5. Attempt upload to 'templates' bucket
      const { data, error } = await supabase.storage
        .from('templates')
        .upload(filePath, blob, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        logger.error('Storage', 'Supabase Upload Error', { error });
        throw error;
      }

      // 6. Return the permanent public URL
      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(filePath);

      logger.info('Storage', 'File successfully moved to Supabase cloud', { publicUrl });
      return publicUrl;
    } catch (err: any) {
      // Graceful fallback to local base64 so the app still works even if cloud fails
      logger.error('Storage', 'Storage operation failed. Using local fallback.', err.message);
      return base64;
    }
  }
};
