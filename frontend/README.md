# Sinhala Text-to-Speech Frontend

A modern, responsive Next.js frontend for the SinhalaVITS-TTS-F1 Text-to-Speech service.

## Features

- ✨ Clean, modern UI built with shadcn/ui components
- 📱 Fully responsive and mobile-friendly design
- ✅ Client-side validation for text input
- ⏳ Loading states during API calls
- 🎵 Audio player with auto-play functionality
- 💾 Download generated WAV files
- 🔍 Real-time API health checking
- ⌨️ Keyboard shortcuts (Ctrl/Cmd + Enter to generate)

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **lucide-react** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Flask API server running on `http://localhost:8000` (see `../SinhalaVITS-TTS-F1/`)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

Or create `.env.local` manually:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Enter Sinhala Text**: Type or paste Sinhala Unicode text in the textarea
2. **Generate Speech**: Click "Generate Speech" or press `Ctrl/Cmd + Enter`
3. **Play Audio**: The generated audio will automatically play
4. **Download**: Click the download button to save the WAV file

## API Configuration

The frontend connects to the Flask API server. Make sure:

1. The Flask server is running (see `../SinhalaVITS-TTS-F1/app.py`)
2. CORS is enabled (already configured in the Flask app)
3. The API URL in `.env.local` matches your Flask server URL

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main TTS interface
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── audio-player.tsx   # Audio player component
│   └── lib/
│       ├── api.ts             # API utility functions
│       └── utils.ts           # Utility functions
└── .env.local                 # Environment variables
```

## Features in Detail

### Client-Side Validation
- Checks for empty text before submission
- Displays clear error messages
- Prevents API calls with invalid input

### Loading States
- Button shows spinner during generation
- Disables input during processing
- Clear visual feedback

### Audio Player
- Auto-plays generated audio
- Play/pause controls
- Progress bar with time display
- Download functionality
- Responsive design

### Health Checking
- Checks API status on page load
- Displays connection status
- Prevents usage if API is unavailable

## Troubleshooting

### API Connection Issues

If you see "API is not available":
1. Ensure the Flask server is running: `python app.py` in `../SinhalaVITS-TTS-F1/`
2. Check the API URL in `.env.local`
3. Verify CORS is enabled in the Flask app

### Build Errors

If you encounter build errors:
1. Clear `.next` directory: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (should be 18+)

## License

This project is part of the SinhalaVITS-TTS-F1 system developed by Dialog Axiata PLC and Dialog-UoM Research Lab.
