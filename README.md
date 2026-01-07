# Sinhala News Reader

A modern web application that fetches Sinhala news headlines from Ada Derana and converts them to speech using AI-powered text-to-speech technology.

## Features

- 📰 **Auto-Fetch Headlines**: Automatically scrapes latest Sinhala news from Ada Derana
- 🔊 **Text-to-Speech**: Converts Sinhala text to natural speech using SinhalaVITS-TTS-F1 model
- 🎵 **Audio Queue System**: Play multiple headlines sequentially like a radio broadcast
- 🎨 **Modern UI**: Responsive design with dark mode and accessibility features
- ⚡ **Real-time Updates**: Auto-refreshes news every 5 minutes
- 💾 **Listen Later**: Save articles for later playback
- 🔗 **Share Feature**: Generate shareable links for specific news items
- ♿ **Accessibility**: High contrast mode, large text, keyboard navigation

## Tech Stack

### Backend
- **Flask**: Python web framework
- **Coqui TTS**: Text-to-speech engine
- **SinhalaVITS-TTS-F1**: Pre-trained Sinhala TTS model
- **BeautifulSoup4**: Web scraping
- **Redis**: Audio caching (optional)

### Frontend
- **Next.js 16**: React framework
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: UI component library
- **React Context**: Global state management

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- Git LFS (for model files)

### Backend Setup

```bash
# Navigate to backend directory
cd SinhalaVITS-TTS-F1

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download model files (required, ~950MB)
bash download_model.sh

# Start server
python app.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
newsreadermodel/
├── SinhalaVITS-TTS-F1/      # Backend Flask API
│   ├── app.py              # Main Flask application
│   ├── news_scraper.py     # Web scraping logic
│   ├── romanizer.py        # Sinhala to Roman conversion
│   ├── requirements.txt    # Python dependencies
│   ├── download_model.sh  # Model download script
│   └── modal_app.py       # Modal deployment config
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── contexts/      # React Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and API client
│   └── package.json       # Node dependencies
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## API Endpoints

### `GET /api/health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "timestamp": "2025-12-30T12:00:00"
}
```

### `POST /api/synthesize`
Convert Sinhala text to speech

**Request:**
```json
{
  "text": "සිංහල පාඨය"
}
```

**Response:** WAV audio file

### `GET /api/fetch-news`
Fetch latest news headlines

**Response:**
```json
{
  "success": true,
  "count": 25,
  "items": [
    {
      "id": 1,
      "title": "පුවත් ශීර්ෂය",
      "link": "https://...",
      "time": "2:15 pm",
      "timestamp": "2025-12-30T14:15:00",
      "category": "උණුසුම් පුවත්",
      "isBreaking": false,
      "text": "පුවත් ශීර්ෂය"
    }
  ]
}
```

## Environment Variables

### Frontend
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

### Running Tests

```bash
# Backend health check
curl http://localhost:8000/api/health

# Test TTS
curl -X POST http://localhost:8000/api/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "සිංහල පාඨය"}' \
  --output test.wav
```

### Code Structure

- **Backend**: Follows Flask best practices with error handling and logging
- **Frontend**: Uses React Context for state, custom hooks for logic
- **Components**: Modular, reusable React components
- **Styling**: Tailwind CSS with shadcn/ui components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project uses the SinhalaVITS-TTS-F1 model from [Hugging Face](https://huggingface.co/dialoglk/SinhalaVITS-TTS-F1).

## Acknowledgments

- [SinhalaVITS-TTS-F1](https://huggingface.co/dialoglk/SinhalaVITS-TTS-F1) - TTS model
- [Ada Derana](https://sinhala.adaderana.lk) - News source
- [Coqui TTS](https://github.com/coqui-ai/TTS) - TTS engine

