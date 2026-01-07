# Vercel Deployment Setup

## ⚠️ CRITICAL: Root Directory Configuration

**You MUST set the Root Directory to `frontend` in Vercel dashboard for the deployment to work.**

### Step-by-Step Instructions:

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project: `newskiyannalk`
3. Click on **Settings** tab
4. Scroll down to **General** section
5. Find **Root Directory** setting
6. Click **Edit** button
7. Select **Other** and enter: `frontend`
8. Click **Save**

**After saving, Vercel will:**
- ✅ Auto-detect Next.js framework from `frontend/package.json`
- ✅ Use the correct build settings automatically
- ✅ Deploy from the `frontend` directory
- ✅ No need for custom vercel.json configuration

### Why This Is Required

Vercel needs to find `package.json` with `next` in dependencies to detect Next.js. Since your `package.json` is in the `frontend/` folder, Vercel must be configured to use that as the root directory.

## Environment Variables

Don't forget to set these in Vercel dashboard → Settings → Environment Variables:

```
NEXT_PUBLIC_SYNTHESIZE_URL=https://rasaljayasinghe--sinhala-tts-synthesize.modal.run
NEXT_PUBLIC_HEALTH_URL=https://rasaljayasinghe--sinhala-tts-health.modal.run
NEXT_PUBLIC_NEWS_URL=https://rasaljayasinghe--sinhala-tts-fetch-news.modal.run
```

## Troubleshooting 404 Errors

If you see a 404 error:
1. Check that the root directory is set to `frontend` in Vercel settings
2. Verify the build completed successfully
3. Check that environment variables are set
4. Ensure Modal endpoints are deployed and accessible

