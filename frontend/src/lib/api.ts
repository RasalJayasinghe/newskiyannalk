/**
 * API utility functions for Sinhala TTS service
 * 
 * Uses Modal cloud deployment for production.
 * For local development, set NEXT_PUBLIC_API_URL to http://localhost:8000
 * 
 * Modal endpoint URLs (set in Vercel environment variables):
 * - NEXT_PUBLIC_SYNTHESIZE_URL: https://rasaljayasinghe--synthesize.modal.run
 * - NEXT_PUBLIC_HEALTH_URL: https://rasaljayasinghe--health.modal.run
 * - NEXT_PUBLIC_NEWS_URL: https://rasaljayasinghe--fetch-news.modal.run
 * 
 * Updated: Modal endpoints deployed and ready
 */

// Only use localhost in development (not in production)
const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (isDevelopment ? 'http://localhost:8000' : '');
const SYNTHESIZE_URL = process.env.NEXT_PUBLIC_SYNTHESIZE_URL || (API_BASE_URL ? `${API_BASE_URL}/api/synthesize` : '');
const HEALTH_URL = process.env.NEXT_PUBLIC_HEALTH_URL || (API_BASE_URL ? `${API_BASE_URL}/api/health` : '');
const NEWS_URL = process.env.NEXT_PUBLIC_NEWS_URL || (API_BASE_URL ? `${API_BASE_URL}/api/fetch-news` : '');

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
  if (!HEALTH_URL) {
    throw new Error('API health endpoint not configured. Please set NEXT_PUBLIC_HEALTH_URL environment variable.');
  }
  
  try {
    const response = await fetch(HEALTH_URL);
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    
    return response.json();
  } catch (err) {
    throw err;
  }
}

/**
 * Synthesize Sinhala text to speech
 */
export async function synthesizeText(text: string): Promise<Blob> {
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:78',message:'synthesizeText entry',data:{text_length:text.length,has_synthesize_url:!!SYNTHESIZE_URL,synthesize_url:SYNTHESIZE_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch(()=>{});
  // #endregion
  if (!SYNTHESIZE_URL) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:81',message:'synthesizeText error - no URL',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw new Error('TTS endpoint not configured. Please set NEXT_PUBLIC_SYNTHESIZE_URL environment variable.');
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:85',message:'synthesizeText before fetch',data:{url:SYNTHESIZE_URL,text_preview:text.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  const response = await fetch(SYNTHESIZE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  // #region agent log
  const contentType = response.headers.get('content-type');
  const responseStatus = response.status;
  const responseOk = response.ok;
  fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:99',message:'synthesizeText after fetch',data:{status:responseStatus,ok:responseOk,content_type:contentType,headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
  // #endregion

  if (!response.ok) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:102',message:'synthesizeText response not ok',data:{status:responseStatus,content_type:contentType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    // Try to parse error response
    if (contentType && contentType.includes('application/json')) {
      const error: ErrorResponse = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:107',message:'synthesizeText parsed error',data:{error:error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      throw new Error(error.details || error.error || 'Failed to generate speech');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  // Check if response is audio
  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:115',message:'synthesizeText checking content type',data:{content_type:contentType,includes_audio_wav:contentType?.includes('audio/wav'),all_headers:Object.fromEntries(response.headers.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  if (contentType && contentType.includes('audio/wav')) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:118',message:'synthesizeText returning blob',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    return response.blob();
  }

  // #region agent log
  fetch('http://127.0.0.1:7244/ingest/33653e76-7dbd-46c1-8b89-1778254aae3c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:123',message:'synthesizeText unexpected response type',data:{content_type:contentType,response_text_preview:await response.clone().text().then(t=>t.substring(0,200)).catch(()=>'could not read')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  throw new Error('Unexpected response type');
}

/**
 * Fetch news headlines from Ada Derana
 */
export async function fetchNews(): Promise<NewsResponse> {
  if (!NEWS_URL) {
    throw new Error('News endpoint not configured. Please set NEXT_PUBLIC_NEWS_URL environment variable.');
  }
  
  try {
    const response = await fetch(NEWS_URL);
    
    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }
    
    return response.json();
  } catch (err) {
    throw err;
  }
}

