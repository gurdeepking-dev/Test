import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { Buffer } from 'buffer';

/**
 * Generates a JWT token for Kling API authentication.
 * Uses HS256 algorithm with the provided access and secret keys.
 */
function generateToken(accessKey: string, secretKey: string) {
  try {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: accessKey,
      exp: now + 1800,
      nbf: now - 60
    };

    const encode = (obj: any) => {
      return Buffer.from(JSON.stringify(obj)).toString('base64url');
    };

    const message = `${encode(header)}.${encode(payload)}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('base64url' as any); 

    return `${message}.${signature}`;
  } catch (err) {
    console.error("[Proxy] Token Generation Error:", err);
    throw new Error("Failed to sign request");
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, payload, taskId, accessKey, secretKey } = req.body;

  if (!accessKey || !secretKey) {
    return res.status(400).json({ error: 'API Credentials (Access/Secret Key) missing' });
  }

  try {
    const token = generateToken(accessKey, secretKey);
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };

    if (action === 'submit') {
      console.log("[Proxy] Submitting task to Kling...");
      const klingRes = await fetch("https://api.klingai.com/v1/videos/image2video", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });
      
      const data = await klingRes.json();
      return res.status(klingRes.status).json(data);
    } 
    
    if (action === 'poll') {
      if (!taskId) return res.status(400).json({ error: 'Missing taskId' });
      
      const klingRes = await fetch(`https://api.klingai.com/v1/videos/image2video/${taskId}`, {
        headers
      });
      
      const data = await klingRes.json();
      return res.status(klingRes.status).json(data);
    }

    return res.status(400).json({ error: 'Invalid proxy action' });
  } catch (err: any) {
    console.error("[Proxy] Execution Error:", err.message);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}