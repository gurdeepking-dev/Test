import { GoogleGenAI } from "@google/genai";
import { logger } from "./logger";
import { storageService } from "./storage";
import { ApiKeyRecord } from "../types";

export const geminiService = {
  async generateStyle(baseImageBase64: string, prompt: string, refinement?: string): Promise<string> {
    logger.info('AI', 'Starting generation process', { promptLength: prompt.length, hasRefinement: !!refinement });

    // Fetch pool from DB
    const settings = await storageService.getAdminSettings();
    let keyPool = settings.geminiApiKeys?.filter(k => k.status === 'active') || [];
    
    // Check for process.env.API_KEY as strictly defined in guidelines
    const envKey = process.env.API_KEY;
    
    // If pool is empty but we have a platform-injected key, use it
    if (keyPool.length === 0 && envKey && envKey.trim() !== '') {
      keyPool.push({
        id: 'env-primary',
        key: envKey,
        label: 'Platform Key',
        status: 'active',
        addedAt: Date.now()
      });
    }

    if (keyPool.length === 0) {
      logger.error('AI', 'No active API keys available');
      throw new Error("Service unavailable. No API key found. Please configure an API key in the environment or Admin Panel.");
    }

    const finalPrompt = refinement 
      ? `Transform this person into the following style: ${prompt}. Additional instructions: ${refinement}. Preserve the person's facial features and identity exactly.`
      : `Transform this person into the following style: ${prompt}. Preserve the person's facial features and identity exactly. High-quality artistic output.`;

    // Try keys in the pool
    for (const apiRecord of keyPool) {
      try {
        if (!apiRecord.key || apiRecord.key.length < 10) continue;

        logger.info('AI', `Attempting with key: ${apiRecord.label}`);
        
        const ai = new GoogleGenAI({ apiKey: apiRecord.key });
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              {
                inlineData: {
                  data: baseImageBase64.includes(',') ? baseImageBase64.split(',')[1] : baseImageBase64,
                  mimeType: 'image/png'
                }
              },
              { text: finalPrompt }
            ]
          }
        });

        if (response.candidates && response.candidates.length > 0) {
          const parts = response.candidates[0].content.parts;
          for (const part of parts) {
            if (part.inlineData) {
              logger.info('AI', `Generation successful with key: ${apiRecord.label}`);
              return `data:image/png;base64,${part.inlineData.data}`;
            }
          }
        }
        
        throw new Error("AI returned no image data.");

      } catch (error: any) {
        const errorMessage = error.message || '';
        const isAuthError = errorMessage.toLowerCase().includes('leaked') || 
                            errorMessage.includes('403') || 
                            errorMessage.includes('401') || 
                            errorMessage.toLowerCase().includes('api_key_invalid');

        logger.warn('AI', `Key ${apiRecord.label} failed`, { message: errorMessage });

        // Auto-disable keys that are clearly broken
        if (isAuthError && apiRecord.id !== 'env-primary') {
          logger.error('AI', `Permanently disabling key ${apiRecord.label} due to auth error`);
          this.deactivateKey(apiRecord.id);
        }

        // If we only have one key and it failed, throw immediately
        if (keyPool.length === 1) throw error;
        continue;
      }
    }

    throw new Error("All available API keys failed. Please check your AI Studio console for quota or validity issues.");
  },

  async deactivateKey(id: string) {
    try {
      const settings = await storageService.getAdminSettings();
      const updatedKeys = (settings.geminiApiKeys || []).map(k => 
        k.id === id ? { ...k, status: 'invalid' as const } : k
      );
      await storageService.saveAdminSettings({ ...settings, geminiApiKeys: updatedKeys });
      logger.info('AI', `Key ${id} marked as invalid in database`);
    } catch (err) {
      logger.error('AI', 'Failed to auto-deactivate key', err);
    }
  }
};