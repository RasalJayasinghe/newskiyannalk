# Modal Deployment Guide

This guide explains how to deploy the Sinhala TTS model to Modal's cloud infrastructure.

## Modal Free Plan Limits

Modal's **Starter (Free) Plan** includes:
- **$30 of free compute credits per month**
- **3 workspace seats**
- **Up to 100 containers**
- **10 concurrent GPU tasks**
- **T4 GPU support** (perfect for TTS inference)

This is sufficient for hosting the TTS model, especially with:
- On-demand GPU usage (only when generating audio)
- Container warm-keeping (1 container kept warm to reduce cold starts)
- Audio caching to reduce redundant inference

## Setup Steps

### 1. Install Modal (Already Done)
```bash
pip install modal
python3 -m modal setup
```

### 2. Upload Model Files to Modal Volume

First, upload the model files to Modal's persistent volume:

```bash
cd SinhalaVITS-TTS-F1
source venv/bin/activate
modal run modal_app.py::upload_model
```

This will:
- Download the model from Hugging Face if not already present
- Upload it to Modal's persistent volume
- Make it available to all containers

### 3. Deploy the App

Deploy the Modal app:

```bash
modal deploy modal_app.py
```

This creates:
- `/synthesize` endpoint (POST) - Generate audio from Sinhala text
- `/health` endpoint (GET) - Health check
- `/fetch-news` endpoint (GET) - Fetch news headlines

### 4. Get Your Endpoint URLs

After deployment, Modal will provide URLs like:
```
https://<workspace>--sinhala-tts-synthesize.modal.run
https://<workspace>--sinhala-tts-health.modal.run
https://<workspace>--sinhala-tts-fetch-news.modal.run
```

### 5. Update Frontend API URL

Update `frontend/src/lib/api.ts` to use the Modal endpoints:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://<workspace>--sinhala-tts.modal.run';
```

## Cost Estimation

### Free Tier Usage:
- **T4 GPU**: ~$0.0004/second (~$0.24/minute)
- **Cold start**: ~10-15 seconds (one-time per container)
- **Warm inference**: ~2-5 seconds per request
- **With caching**: Most requests are instant (no GPU needed)

### Monthly Estimate (Light Usage):
- 1000 requests/month
- Average 3 seconds GPU time per request
- Total: ~3000 seconds = 50 minutes
- Cost: ~$0.24 × 50 = **$12/month** (well within $30 free tier)

### Monthly Estimate (Heavy Usage):
- 10,000 requests/month
- Average 3 seconds GPU time per request
- Total: ~30,000 seconds = 500 minutes
- Cost: ~$0.24 × 500 = **$120/month** (would exceed free tier)

## Features

### 1. GPU Acceleration
- Uses T4 GPU for fast inference
- Automatically falls back to CPU if GPU unavailable

### 2. Container Warm-Keeping
- Keeps 1 container warm to reduce cold starts
- First request: ~10-15 seconds (cold start)
- Subsequent requests: ~2-5 seconds (warm)

### 3. Audio Caching
- Caches generated audio for 24 hours
- Reduces redundant GPU usage
- Instant response for cached requests

### 4. Persistent Model Storage
- Model stored in Modal volume (persistent)
- No need to download model on each cold start
- Fast container initialization

## Monitoring

View usage and costs in Modal dashboard:
```bash
modal app show sinhala-tts
```

Or visit: https://modal.com/apps

## Troubleshooting

### Model Not Found
If model files are missing, run:
```bash
modal run modal_app.py::upload_model
```

### Cold Start Too Slow
Increase `keep_warm` parameter:
```python
keep_warm=2  # Keep 2 containers warm
```

### Out of Credits
- Check usage in Modal dashboard
- Consider reducing `keep_warm` containers
- Increase cache expiry time to reduce GPU usage

## Local Testing

Test locally before deploying:
```bash
modal run modal_app.py::main
```

## Production Deployment

For production, use:
```bash
modal deploy modal_app.py
```

This creates persistent endpoints that don't require keeping the terminal open.

