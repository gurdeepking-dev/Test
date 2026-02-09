import { storageService } from './storage';
import { logger } from './logger';

export interface KlingParams {
  prompt: string;
  negative_prompt?: string;
  duration: "5" | "10";
  aspect_ratio: "9:16" | "16:9" | "1:1";
  mode: "std" | "pro";
  camera_control?: {
    zoom?: number; 
    pan?: number; 
    tilt?: number; 
  };
}

export const klingService = {
  async generateVideo(startImage: string, endImage: string | null, params: KlingParams, onStatus?: (status: string) => void): Promise<string> {
    const settings = await storageService.getAdminSettings();
    const accessKey = settings.klingAccessKey;
    const secretKey = settings.klingSecretKey;

    if (!accessKey || !secretKey) {
      throw new Error("Kling API credentials are not configured. Go to Admin -> Payment/API to set them.");
    }

    const cleanBase64 = (str: string) => str.includes(',') ? str.split(',')[1] : str;

    const payload: any = {
      model: "kling-v1",
      image: cleanBase64(startImage),
      prompt: params.prompt || "cinematic masterpiece animation",
      negative_prompt: params.negative_prompt || "blurry, low quality, distorted",
      cfg_scale: params.mode === "pro" ? 0.7 : 0.5,
      duration: params.duration,
      aspect_ratio: params.aspect_ratio,
      mode: params.mode
    };

    if (endImage) payload.last_image = cleanBase64(endImage);

    // Initial Submit with Timeout
    if (onStatus) onStatus("Connecting to Studio...");
    console.log("[KlingService] Calling proxy /api/kling-proxy...");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout for submission

    try {
      const submitResponse = await fetch("/api/kling-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ 
          action: 'submit', 
          payload, 
          accessKey, 
          secretKey 
        })
      });

      clearTimeout(timeoutId);

      if (!submitResponse.ok) {
        const errBody = await submitResponse.json().catch(() => ({ error: 'Unknown Proxy Error' }));
        throw new Error(errBody.error || `Proxy unreachable (${submitResponse.status})`);
      }

      const submitData = await submitResponse.json();
      if (submitData.code !== 0) {
        throw new Error(`Kling API: ${submitData.message || 'Unknown Error'}`);
      }

      const taskId = submitData.data.task_id;
      console.log(`[KlingService] Task created: ${taskId}`);

      let attempts = 0;
      const maxAttempts = 120; // 20 mins max for rendering
      
      while (attempts < maxAttempts) {
        attempts++;
        if (onStatus) onStatus(`Rendering: ${Math.min(attempts * 1, 99)}%`);
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        try {
          const pollResponse = await fetch("/api/kling-proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              action: 'poll', 
              taskId, 
              accessKey, 
              secretKey 
            })
          });
          
          if (!pollResponse.ok) continue;

          const pollData = await pollResponse.json();
          const status = pollData.data?.task_status;
          
          if (status === "succeed") {
            const videoUrl = pollData.data.video_resource?.url;
            if (!videoUrl) throw new Error("Video link not provided by API.");
            
            // Final Fetch of Video File
            const videoRes = await fetch(videoUrl);
            const blob = await videoRes.blob();
            return URL.createObjectURL(blob);
          } else if (status === "failed") {
            throw new Error(`Kling Render Error: ${pollData.data.task_status_msg || 'Rejected'}`);
          }
        } catch (pollErr: any) {
          console.warn("[KlingService] Polling glitch:", pollErr.message);
          // Continue loop despite minor polling errors
        }
      }
      throw new Error("Render process timed out.");
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error("Request timed out. The server didn't respond in time.");
      }
      logger.error("KlingService", "Generation failed", err);
      throw err;
    }
  }
};
