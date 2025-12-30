# Deployment Guide

This guide covers deploying the Sinhala News Reader application to production.

## Architecture

- **Frontend**: Next.js app (deploy to Vercel)
- **Backend**: Flask API (deploy to Render)
- **Model Files**: Large files (~950MB) need to be downloaded separately

## Backend Deployment (Render)

### Prerequisites

1. Create a [Render](https://render.com) account
2. Connect your GitHub repository

### Steps

1. **Prepare Model Files**:
   - The model files (`Nipunika_210000.pth` and `Nipunika_config.json`) are too large for Git
   - You have two options:
     - **Option A**: Use Git LFS (recommended for development)
     - **Option B**: Download on Render during build (recommended for production)

2. **Deploy on Render**:
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Select the repository and branch
   - Configure:
     - **Name**: `sinhala-tts-api`
     - **Root Directory**: `SinhalaVITS-TTS-F1`
     - **Environment**: `Python 3`
     - **Build Command**: 
       ```bash
       pip install -r requirements.txt && bash download_model.sh
       ```
     - **Start Command**: 
       ```bash
       gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
       ```
     - **Instance Type**: At least `Starter` (512MB RAM) or better `Standard` (2GB RAM) for model loading

3. **Environment Variables** (optional):
   - `REDIS_URL`: If using Redis for caching (optional)
   - `PORT`: Automatically set by Render

4. **Health Check**:
   - Render will automatically check `/api/health`

### Alternative: Download Model on First Run

If you prefer to download the model on first API call instead of during build:

1. Modify `app.py` to download model if not found
2. Add this to your build command:
   ```bash
   pip install -r requirements.txt
   ```

## Frontend Deployment (Vercel)

### Prerequisites

1. Create a [Vercel](https://vercel.com) account
2. Install Vercel CLI (optional): `npm i -g vercel`

### Steps

1. **Update API URL**:
   - Update `frontend/src/lib/api.ts` to use your Render backend URL
   - Or use environment variable: `NEXT_PUBLIC_API_URL`

2. **Deploy**:
   - **Option A**: Via Vercel Dashboard
     - Go to Vercel Dashboard → New Project
     - Import your GitHub repository
     - Root Directory: `frontend`
     - Framework Preset: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next`
   
   - **Option B**: Via CLI
     ```bash
     cd frontend
     vercel
     ```

3. **Environment Variables**:
   - Add `NEXT_PUBLIC_API_URL` with your Render backend URL
   - Example: `https://sinhala-tts-api.onrender.com`

## Local Development Setup

### Backend

```bash
cd SinhalaVITS-TTS-F1
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
bash download_model.sh  # Download model files
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Model Files Management

The model files are ~950MB and cannot be committed to Git. Options:

1. **Git LFS** (for development):
   ```bash
   git lfs install
   git lfs track "*.pth"
   git add .gitattributes
   ```

2. **Download Script** (for production):
   - Use `download_model.sh` to download from Hugging Face
   - Add to `.gitignore` to exclude from commits

3. **Cloud Storage** (alternative):
   - Upload to S3/CloudFlare R2
   - Download during deployment

## Environment Variables

### Backend (Render)

- `PORT`: Automatically set by Render
- `REDIS_URL`: Optional, for caching (if using Redis)

### Frontend (Vercel)

- `NEXT_PUBLIC_API_URL`: Your Render backend URL

## Troubleshooting

### Backend Issues

- **Model not loading**: Ensure model files are downloaded
- **Memory errors**: Upgrade to larger instance on Render
- **Timeout**: Increase timeout in gunicorn command

### Frontend Issues

- **API errors**: Check `NEXT_PUBLIC_API_URL` is correct
- **CORS errors**: Ensure backend CORS is configured for your Vercel domain

## Cost Considerations

- **Render Free Tier**: 
  - 750 hours/month
  - Spins down after 15 min inactivity
  - May need to upgrade for production use

- **Vercel Free Tier**:
  - Unlimited deployments
  - Great for frontend hosting

## Production Checklist

- [ ] Model files downloaded/accessible
- [ ] Environment variables configured
- [ ] CORS configured for frontend domain
- [ ] Health check endpoint working
- [ ] Redis caching set up (optional)
- [ ] Error logging configured
- [ ] Domain names configured (optional)

