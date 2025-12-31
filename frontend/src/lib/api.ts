/**
 * API utility functions for Sinhala TTS service
 * Uses Vercel serverless function (which falls back to Render backend)
 */

// Backend URL for health checks and news fetching (always uses Render backend)
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
 * Always uses Render backend (health check not available via Hugging Face API)
 */
export async function checkHealth(): Promise<HealthResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${backendUrl}/api/health`);
  
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  
  return response.json();
}

/**
 * Synthesize Sinhala text to speech
 * Uses Vercel serverless function in production (which tries Hugging Face API first, then Render backend)
 * Uses Render backend directly in development
 */
export async function synthesizeText(text: string): Promise<Blob> {
  // In production, use Vercel serverless function; in dev, use Render backend
  const ttsEndpoint = 
    process.env.NODE_ENV === 'production'
      ? '/api/tts' // Vercel serverless function
      : `${BACKEND_URL}/api/synthesize`; // Direct Render backend
  
  const response = await fetch(ttsEndpoint, {
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
 * Always uses Render backend (news scraping not available via Hugging Face API)
 */
export async function fetchNews(): Promise<NewsResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const response = await fetch(`${backendUrl}/api/fetch-news`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch news');
  }
  
  return response.json();
}

