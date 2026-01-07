# Deployment Guide

This guide explains how to deploy the Sinhala News Reader app to production.

## Architecture Overview

The app consists of two parts:
1. **Frontend (Next.js)**: Hosted on Netlify or Vercel
2. **Backend (TTS API)**: Hosted on Modal (cloud infrastructure)

These are **separate services** that communicate via HTTP API calls.

## How It Works

```
User Browser
    ↓
Netlify/Vercel (Frontend)
    ↓ HTTP API calls
Modal (Backend TTS API)
    ↓
Returns audio/data
```

**Yes, Modal will work when your frontend is hosted on Netlify/Vercel!** They are independent services that communicate over the internet.

## Step 1: Deploy Backend to Modal

### 1.1 Upload Model Files

```bash
cd SinhalaVITS-TTS-F1
source venv/bin/activate
modal run modal_app.py::upload_model
```

This uploads the TTS model to Modal's persistent storage.

### 1.2 Deploy Modal App

```bash
modal deploy modal_app.py
```

After deployment, Modal will provide you with endpoint URLs like:
- `https://rasaljayasinghe--sinhala-tts-synthesize.modal.run`
- `https://rasaljayasinghe--sinhala-tts-health.modal.run`
- `https://rasaljayasinghe--sinhala-tts-fetch-news.modal.run`

**Save these URLs** - you'll need them for the frontend configuration.

## Step 2: Deploy Frontend to Netlify

### 2.1 Prepare for Deployment

1. Push your code to GitHub (already done)

2. Create `netlify.toml` in the project root:

```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/.next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 2.2 Deploy on Netlify

1. Go to [Netlify](https://www.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Set build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

### 2.3 Configure Environment Variables

In Netlify dashboard → Site settings → Environment variables, add:

```
NEXT_PUBLIC_SYNTHESIZE_URL=https://rasaljayasinghe--sinhala-tts-synthesize.modal.run
NEXT_PUBLIC_HEALTH_URL=https://rasaljayasinghe--sinhala-tts-health.modal.run
NEXT_PUBLIC_NEWS_URL=https://rasaljayasinghe--sinhala-tts-fetch-news.modal.run
```

Or use a single base URL:

```
NEXT_PUBLIC_API_URL=https://rasaljayasinghe--sinhala-tts.modal.run
```

### 2.4 Redeploy

After adding environment variables, trigger a new deployment.

## Step 3: Deploy Frontend to Vercel (Alternative)

### 3.1 Deploy on Vercel

1. Go to [Vercel](https://vercel.com/)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`

### 3.2 Configure Environment Variables

In Vercel dashboard → Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_SYNTHESIZE_URL=https://rasaljayasinghe--sinhala-tts-synthesize.modal.run
NEXT_PUBLIC_HEALTH_URL=https://rasaljayasinghe--sinhala-tts-health.modal.run
NEXT_PUBLIC_NEWS_URL=https://rasaljayasinghe--sinhala-tts-fetch-news.modal.run
```

### 3.3 Deploy

Vercel will automatically deploy on every push to main branch.

## Environment Variables Reference

### Option 1: Individual Endpoints (Recommended for Modal)

```bash
NEXT_PUBLIC_SYNTHESIZE_URL=https://<workspace>--sinhala-tts-synthesize.modal.run
NEXT_PUBLIC_HEALTH_URL=https://<workspace>--sinhala-tts-health.modal.run
NEXT_PUBLIC_NEWS_URL=https://<workspace>--sinhala-tts-fetch-news.modal.run
```

### Option 2: Base URL (For local Flask or unified API)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000  # Local development
# OR
NEXT_PUBLIC_API_URL=https://your-api-domain.com  # Production
```

## CORS Configuration

Modal endpoints automatically handle CORS, so your frontend can call them from any domain.

## Testing Deployment

1. **Test Modal endpoints directly**:
   ```bash
   curl -X POST https://rasaljayasinghe--sinhala-tts-synthesize.modal.run \
     -H "Content-Type: application/json" \
     -d '{"text": "සිංහල"}'
   ```

2. **Test frontend**: Visit your Netlify/Vercel URL and try generating audio

## Cost Breakdown

### Modal (Backend)
- **Free tier**: $30/month in compute credits
- **Light usage**: ~$12/month (within free tier)
- **Heavy usage**: ~$120/month (would exceed free tier)

### Netlify/Vercel (Frontend)
- **Free tier**: Generous limits for static sites
- **Next.js hosting**: Free for personal projects
- **Bandwidth**: Usually sufficient on free tier

## Troubleshooting

### CORS Errors
- Modal handles CORS automatically
- If issues persist, check Modal endpoint URLs

### 404 Errors
- Verify environment variables are set correctly
- Check Modal endpoint URLs are accessible

### Audio Not Playing
- Check browser console for errors
- Verify Modal endpoints are responding
- Test Modal endpoints directly with curl

### Cold Start Delays
- First request to Modal may take 10-15 seconds
- Subsequent requests are faster (2-5 seconds)
- Consider increasing `keep_warm` in `modal_app.py`

## Monitoring

### Modal Dashboard
- View usage: https://modal.com/apps
- Check costs: Modal dashboard → Billing

### Netlify/Vercel Dashboard
- View deployments: Project dashboard
- Check logs: Deploy logs section

## Summary

✅ **Modal runs independently** - it's a cloud service, not part of your frontend  
✅ **Netlify/Vercel hosts frontend** - makes API calls to Modal  
✅ **They communicate over HTTP** - no special configuration needed  
✅ **Free tiers available** - for both Modal and Netlify/Vercel  

Your app will work perfectly when deployed! 🚀

