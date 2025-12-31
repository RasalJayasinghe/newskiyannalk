/**
 * Vercel Serverless API Route for TTS using Hugging Face Inference API
 * Falls back to Render backend if Hugging Face API is unavailable
 */

import { NextRequest, NextResponse } from 'next/server';

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/dialoglk/SinhalaVITS-TTS-F1';
const RENDER_BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Try Hugging Face Inference API first
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    
    if (hfApiKey) {
      try {
        const hfResponse = await fetch(HUGGINGFACE_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: text }),
        });

        if (hfResponse.ok) {
          const audioBlob = await hfResponse.blob();
          return new NextResponse(audioBlob, {
            headers: {
              'Content-Type': 'audio/wav',
              'Content-Disposition': 'attachment; filename="synthesized.wav"',
            },
          });
        } else {
          // If HF API fails, log and fall through to Render backend
          console.warn('Hugging Face API failed, falling back to Render backend:', hfResponse.status);
        }
      } catch (hfError) {
        console.warn('Hugging Face API error, falling back to Render backend:', hfError);
      }
    }

    // Fallback to Render backend
    const backendResponse = await fetch(`${RENDER_BACKEND_URL}/api/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: error.error || 'Failed to generate speech' },
        { status: backendResponse.status }
      );
    }

    const audioBlob = await backendResponse.blob();
    return new NextResponse(audioBlob, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': 'attachment; filename="synthesized.wav"',
      },
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

