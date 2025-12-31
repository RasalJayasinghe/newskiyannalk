# Hugging Face Integration Guide

This guide explains how to use the Hugging Face hosted model with your Vercel deployment.

## Architecture Overview

Your app now supports **two deployment options**:

1. **Option A: Hugging Face Inference API (Recommended for Vercel)**
   - Uses Hugging Face's hosted Inference API
   - No need to host the model yourself
   - Works with Vercel serverless functions
   - Falls back to Render backend if API key is not set

2. **Option B: Render Backend (Current Setup)**
   - Downloads model from Hugging Face during build
   - Full control over model execution
   - Better for high-volume usage

## Option A: Using Hugging Face Inference API

### Step 1: Get Hugging Face API Token

1. Sign up or log in to [Hugging Face](https://huggingface.co)
2. Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
3. Create a new token with **Read** permissions
4. Copy the token

### Step 2: Configure Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following variable:
   - **Name**: `HUGGINGFACE_API_KEY`
   - **Value**: Your Hugging Face API token
   - **Environment**: Production, Preview, Development (select all)

### Step 3: Deploy to Vercel

The app will automatically:
- Try Hugging Face Inference API first (if `HUGGINGFACE_API_KEY` is set)
- Fall back to Render backend if Hugging Face API fails or is unavailable

### How It Works

The Vercel serverless function (`frontend/src/app/api/tts/route.ts`) will:
1. Check if `HUGGINGFACE_API_KEY` is set
2. If yes, call Hugging Face Inference API
3. If Hugging Face API fails or key is missing, fall back to Render backend
4. Return the audio to the frontend

## Option B: Using Render Backend (Current Setup)

This is your current setup and works well for production:

1. **Backend on Render**: Downloads model from Hugging Face during build
2. **Frontend on Vercel**: Calls Render backend API

### Render Backend Configuration

The `download_model.sh` script already downloads the model from Hugging Face:
- Model URL: `https://huggingface.co/dialoglk/SinhalaVITS-TTS-F1/resolve/main/Nipunika_210000.pth`
- Config URL: `https://huggingface.co/dialoglk/SinhalaVITS-TTS-F1/resolve/main/Nipunika_config.json`

## Testing Locally

### Test Hugging Face API Route

```bash
# Set your API key
export HUGGINGFACE_API_KEY=your_token_here

# Run the frontend
cd frontend
npm run dev

# Test the API route
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "ආයුබෝවන්"}' \
  --output test.wav
```

### Test Render Backend Directly

```bash
# Start Render backend locally
cd SinhalaVITS-TTS-F1
source venv/bin/activate
python app.py

# Test the backend
curl -X POST http://localhost:8000/api/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "ආයුබෝවන්"}' \
  --output test.wav
```

## Important Notes

### Hugging Face Inference API Limitations

- **Rate Limits**: Free tier has rate limits (check [Hugging Face pricing](https://huggingface.co/pricing))
- **Model Availability**: Not all models support Inference API - if this model doesn't, it will automatically fall back to Render backend
- **Latency**: API calls may have slightly higher latency than local inference

### Render Backend Advantages

- **No Rate Limits**: Full control over usage
- **Lower Latency**: Model runs on your server
- **Cost Predictable**: Fixed monthly cost vs. per-request pricing
- **Always Available**: No dependency on Hugging Face API availability

## Recommendation

For **production use**, we recommend:
- **Keep Render backend** for reliable, high-volume TTS generation
- **Use Hugging Face API** as a backup or for development/testing

The current implementation automatically handles both, so you get the best of both worlds!

## Troubleshooting

### Hugging Face API Returns 503

This means the model is loading or not available via Inference API. The app will automatically fall back to Render backend.

### Both APIs Fail

Check:
1. Render backend is running and accessible
2. `NEXT_PUBLIC_API_URL` environment variable is set correctly
3. Network connectivity

## References

- [Hugging Face Inference API Docs](https://huggingface.co/docs/api-inference/index)
- [Model Page](https://huggingface.co/dialoglk/SinhalaVITS-TTS-F1)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

