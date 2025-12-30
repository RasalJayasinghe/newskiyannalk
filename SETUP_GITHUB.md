# GitHub Setup Guide

Follow these steps to push your project to GitHub and deploy it.

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository
2. Name it: `sinhala-news-reader` (or your preferred name)
3. **Don't** initialize with README, .gitignore, or license (we already have these)

## Step 2: Push to GitHub

```bash
# Navigate to project root
cd /Users/rasaljayasinghe/Documents/newsreadermodel

# Add all files (model files will be ignored by .gitignore)
git add .

# Commit
git commit -m "Initial commit: Sinhala News Reader with TTS"

# Add remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Handle Model Files

The model files (`*.pth`) are ~950MB and are excluded from Git. You have two options:

### Option A: Use Git LFS (Recommended for Development)

```bash
# Install Git LFS
brew install git-lfs  # macOS
# or
sudo apt-get install git-lfs  # Linux

# Initialize Git LFS
git lfs install

# Track model files
git lfs track "*.pth"
git add .gitattributes
git commit -m "Add Git LFS tracking for model files"
git push
```

### Option B: Download on Deployment (Recommended for Production)

Model files will be downloaded automatically during Render deployment using `download_model.sh`.

## Step 4: Deploy Backend to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub account and select your repository
4. Configure:
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
   - **Instance Type**: `Starter` (512MB) or `Standard` (2GB) - **2GB recommended** for model loading
5. Click **Create Web Service**
6. Wait for deployment (first build will take ~10-15 minutes to download model)
7. Copy your service URL (e.g., `https://sinhala-tts-api.onrender.com`)

## Step 5: Deploy Frontend to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
5. Add Environment Variable:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: Your Render backend URL (e.g., `https://sinhala-tts-api.onrender.com`)
6. Click **Deploy**
7. Wait for deployment (~2-3 minutes)

## Step 6: Update CORS (if needed)

If you get CORS errors, update `SinhalaVITS-TTS-F1/app.py`:

```python
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "https://your-vercel-app.vercel.app"
        ]
    }
})
```

Or allow all origins (for development):
```python
CORS(app)  # Already configured
```

## Step 7: Test Deployment

1. Visit your Vercel frontend URL
2. Check if news loads
3. Try playing a headline
4. Check browser console for any errors

## Troubleshooting

### Backend Issues

- **Model not loading**: Check Render logs, ensure model files downloaded
- **Memory errors**: Upgrade to larger instance (2GB+)
- **Timeout**: Increase timeout in gunicorn command
- **Build fails**: Check Render build logs

### Frontend Issues

- **API errors**: Verify `NEXT_PUBLIC_API_URL` is correct
- **CORS errors**: Update CORS settings in backend
- **Build fails**: Check Vercel build logs

## Environment Variables Summary

### Render (Backend)
- `PORT`: Auto-set by Render
- `REDIS_URL`: Optional, for caching

### Vercel (Frontend)
- `NEXT_PUBLIC_API_URL`: Your Render backend URL

## Next Steps

- Set up custom domains (optional)
- Configure Redis for caching (optional)
- Set up monitoring and logging
- Add CI/CD workflows (already included in `.github/workflows/ci.yml`)

## Cost Estimate

- **Render Free Tier**: 750 hours/month (spins down after 15 min inactivity)
- **Vercel Free Tier**: Unlimited deployments
- **Total**: Free for development/testing

For production, consider:
- Render paid tier: ~$7/month (always-on)
- Vercel Pro: ~$20/month (optional, free tier is usually enough)

