/**
 * API utility functions for Sinhala TTS service
 * 
 * Supports both local Flask server and Modal cloud deployment:
 * - Local: http://localhost:8000
 * - Modal: https://<workspace>--sinhala-tts-<endpoint>.modal.run
 */

// For Modal deployment, set NEXT_PUBLIC_API_URL to your Modal base URL
// Example: https://rasaljayasinghe--sinhala-tts.modal.run
// Or use individual endpoint URLs:
// - NEXT_PUBLIC_SYNTHESIZE_URL: https://rasaljayasinghe--sinhala-tts-synthesize.modal.run
// - NEXT_PUBLIC_HEALTH_URL: https://rasaljayasinghe--sinhala-tts-health.modal.run
// - NEXT_PUBLIC_NEWS_URL: https://rasaljayasinghe--sinhala-tts-fetch-news.modal.run

// #region agent log
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SYNTHESIZE_URL = process.env.NEXT_PUBLIC_SYNTHESIZE_URL || `${API_BASE_URL}/api/synthesize`;
const HEALTH_URL = process.env.NEXT_PUBLIC_HEALTH_URL || `${API_BASE_URL}/api/health`;
const NEWS_URL = process.env.NEXT_PUBLIC_NEWS_URL || `${API_BASE_URL}/api/fetch-news`;
fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:16',message:'API URLs initialized',data:{API_BASE_URL,HEALTH_URL,NEWS_URL,SYNTHESIZE_URL,hasEnvVars:!!process.env.NEXT_PUBLIC_API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
// #endregion

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  timestamp: string;
  error?: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  link: string;
  time: string;
  timestamp: string;
  category: string;
  isBreaking: boolean;
  text: string;
}

export interface NewsResponse {
  success: boolean;
  count: number;
  items: NewsItem[];
  timestamp: string;
  error?: string;
  details?: string;
}

/**
 * Check API health status
 */
export async function checkHealth(): Promise<HealthResponse> {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:56',message:'checkHealth called',data:{HEALTH_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    const response = await fetch(HEALTH_URL);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:59',message:'Health check response',data:{ok:response.ok,status:response.status,url:response.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!response.ok) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:61',message:'Health check failed',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw new Error('Health check failed');
    }
    const result = await response.json();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:67',message:'Health check success',data:{result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return result;
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:70',message:'Health check error',data:{error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw err;
  }
}

/**
 * Synthesize Sinhala text to speech
 */
export async function synthesizeText(text: string): Promise<Blob> {
  // Modal endpoint expects form data or JSON with 'text' field
  const isModalEndpoint = SYNTHESIZE_URL.includes('modal.run');
  
  const response = await fetch(SYNTHESIZE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    // Try to parse error response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.details || error.error || 'Failed to generate speech');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Check if response is audio
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('audio/wav')) {
    return response.blob();
  }

  throw new Error('Unexpected response type');
}

/**
 * Fetch news headlines from Ada Derana
 */
export async function fetchNews(): Promise<NewsResponse> {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:124',message:'fetchNews called',data:{NEWS_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  try {
    const response = await fetch(NEWS_URL);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:127',message:'fetchNews response',data:{ok:response.ok,status:response.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!response.ok) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:129',message:'fetchNews failed',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      throw new Error('Failed to fetch news');
    }
    const result = await response.json();
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:134',message:'fetchNews success',data:{success:result.success,count:result.count},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return result;
  } catch (err) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:137',message:'fetchNews error',data:{error:err instanceof Error ? err.message : String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    throw err;
  }
}

