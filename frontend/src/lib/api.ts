/**
 * API utility functions for Sinhala TTS service
 * 
 * Uses Modal cloud deployment for production.
 * For local development, set NEXT_PUBLIC_API_URL to http://localhost:8000
 * 
 * Modal endpoint URLs (set in Vercel environment variables):
 * - NEXT_PUBLIC_SYNTHESIZE_URL: https://<workspace>--sinhala-tts-synthesize.modal.run
 * - NEXT_PUBLIC_HEALTH_URL: https://<workspace>--sinhala-tts-health.modal.run
 * - NEXT_PUBLIC_NEWS_URL: https://<workspace>--sinhala-tts-fetch-news.modal.run
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
  if (!SYNTHESIZE_URL) {
    throw new Error('TTS endpoint not configured. Please set NEXT_PUBLIC_SYNTHESIZE_URL environment variable.');
  }
  
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

