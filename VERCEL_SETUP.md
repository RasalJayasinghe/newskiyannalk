# Vercel Deployment Setup

## Important: Root Directory Configuration

Since the Next.js app is in the `frontend/` subdirectory, you **must** configure Vercel to use `frontend` as the root directory.

### Steps:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **General**
3. Under **Root Directory**, click **Edit**
4. Set the root directory to: `frontend`
5. Save changes

Vercel will then:
- Auto-detect Next.js framework
- Use the correct build settings
- Deploy from the `frontend` directory

### Alternative: If you can't set root directory

If you need to deploy from the repository root, the `vercel.json` file is configured, but you still need to ensure:
- Build command: `cd frontend && npm install && npm run build`
- Output directory: `frontend/.next`
- Framework: `nextjs`

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

