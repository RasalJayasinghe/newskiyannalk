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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const SYNTHESIZE_URL = process.env.NEXT_PUBLIC_SYNTHESIZE_URL || `${API_BASE_URL}/api/synthesize`;
const HEALTH_URL = process.env.NEXT_PUBLIC_HEALTH_URL || `${API_BASE_URL}/api/health`;
const NEWS_URL = process.env.NEXT_PUBLIC_NEWS_URL || `${API_BASE_URL}/api/fetch-news`;

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
  const response = await fetch(HEALTH_URL);
  
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  
  return response.json();
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
  const response = await fetch(NEWS_URL);
  
  if (!response.ok) {
    throw new Error('Failed to fetch news');
  }
  
  return response.json();
}

