"""
Modal deployment for SinhalaVITS-TTS-F1 Text-to-Speech Service
This script deploys the TTS model to Modal's cloud infrastructure.
"""

import os
import io
import re
import hashlib
import logging
from datetime import datetime, timedelta
from pathlib import Path

import modal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Modal app and image setup
app = modal.App("sinhala-tts")

# Create a volume to store the model files (persistent storage)
model_volume = modal.Volume.from_name("sinhala-tts-models", create_if_missing=True)

# Define the image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.9")
    .apt_install("git", "ffmpeg")
    .pip_install(
        "torch>=2.0.0",
        "TTS==0.20.0",
        "numpy",
        "soundfile",
        "pydub",
        "flask==3.0.3",
        "flask-cors>=4.0.0",
        "beautifulsoup4>=4.12.0",
        "requests>=2.31.0",
        "lxml>=4.9.0",
        "gunicorn>=21.2.0",
        "huggingface-hub",
    )
    .copy_local_file("news_scraper.py", "/root/news_scraper.py")
    .copy_local_file("romanizer.py", "/root/romanizer.py")
    .env({"PYTHONPATH": "/root"})
)

# Model paths
MODEL_PATH = "/models/Nipunika_210000.pth"
CONFIG_PATH = "/models/Nipunika_config.json"

# Sinhala Unicode range
SINHALA_UNICODE_RANGE = re.compile(r'[\u0D80-\u0DFF\s\.,!?;:\-\(\)\[\]"]+')

# In-memory cache (per container)
audio_cache = {}
CACHE_EXPIRY_HOURS = 24


def validate_sinhala_text(text):
    """Validate that the text contains Sinhala characters."""
    if not text or not text.strip():
        return False, "Text is empty or contains only whitespace"
    
    text_clean = re.sub(r'[\s\.,!?;:\-\(\)\[\]"]+', '', text)
    
    if not text_clean:
        return False, "Text contains only whitespace and punctuation"
    
    has_sinhala = bool(re.search(r'[\u0D80-\u0DFF]', text))
    
    if not has_sinhala:
        has_non_ascii = bool(re.search(r'[^\x00-\x7F]', text))
        if has_non_ascii:
            return False, "Text contains non-Sinhala characters. Please provide text in Sinhala Unicode."
        else:
            return False, "Text does not contain Sinhala characters. Please provide text in Sinhala Unicode (සිංහල)."
    
    return True, None


def get_text_hash(text):
    """Generate hash for text caching"""
    return hashlib.md5(text.encode('utf-8')).hexdigest()


def get_cached_audio(text):
    """Get cached audio if available and not expired"""
    text_hash = get_text_hash(text)
    if text_hash in audio_cache:
        audio_bytes, timestamp = audio_cache[text_hash]
        if datetime.now() - timestamp < timedelta(hours=CACHE_EXPIRY_HOURS):
            logger.info(f"Cache hit for text hash: {text_hash[:8]}...")
            return audio_bytes
        else:
            del audio_cache[text_hash]
            logger.info(f"Cache expired for text hash: {text_hash[:8]}...")
    return None


def cache_audio(text, audio_bytes):
    """Cache audio bytes with timestamp"""
    text_hash = get_text_hash(text)
    audio_cache[text_hash] = (audio_bytes, datetime.now())
    logger.info(f"Cached audio for text hash: {text_hash[:8]}... (Cache size: {len(audio_cache)})")


# Global synthesizer (loaded once per container)
synth = None
model_loaded = False


def load_model():
    """Load the TTS model."""
    global synth, model_loaded
    
    if model_loaded:
        return True
    
    try:
        from TTS.utils.synthesizer import Synthesizer
        import torch
        
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
        
        if not os.path.exists(CONFIG_PATH):
            raise FileNotFoundError(f"Config file not found: {CONFIG_PATH}")
        
        logger.info(f"Loading model from {MODEL_PATH}...")
        use_cuda = torch.cuda.is_available()
        device = "cuda" if use_cuda else "cpu"
        logger.info(f"Using device: {device}")
        
        synth = Synthesizer(
            tts_checkpoint=MODEL_PATH,
            tts_config_path=CONFIG_PATH,
            use_cuda=use_cuda
        )
        
        model_loaded = True
        logger.info("Model loaded successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return False


@app.function(
    image=image,
    gpu="T4",  # Use T4 GPU for faster inference (free tier supports T4)
    volumes={"/models": model_volume},
    timeout=300,  # 5 minute timeout
    keep_warm=1,  # Keep 1 container warm to reduce cold starts
)
@modal.web_endpoint(method="POST", label="synthesize")
def synthesize(text: str):
    """
    Synthesize Sinhala text to speech.
    
    Args:
        text: Sinhala text to synthesize
        
    Returns:
        Audio file as bytes
    """
    try:
        # Validate input
        is_valid, error_msg = validate_sinhala_text(text)
        if not is_valid:
            return {"error": error_msg}, 400
        
        # Check cache first
        cached_audio = get_cached_audio(text)
        if cached_audio:
            return modal.web.Response(
                body=cached_audio,
                headers={"Content-Type": "audio/wav"},
            )
        
        # Load model if not loaded
        if not load_model():
            return {"error": "Failed to load TTS model"}, 500
        
        # Romanize Sinhala text
        try:
            from romanizer import sinhala_to_roman
            romanized = sinhala_to_roman(text)
            logger.info(f"Romanized text: {romanized[:50]}...")
        except Exception as e:
            logger.warning(f"Romanization failed: {e}, using original text")
            romanized = text
        
        # Generate audio
        logger.info(f"Generating audio for text: {text[:50]}...")
        wav = synth.tts(romanized)
        
        # Convert to bytes
        audio_buffer = io.BytesIO()
        import soundfile as sf
        import numpy as np
        
        # Ensure wav is numpy array
        if isinstance(wav, list):
            wav = np.array(wav)
        
        sf.write(audio_buffer, wav, synth.output_sample_rate, format='WAV')
        audio_bytes = audio_buffer.getvalue()
        
        # Cache the audio
        cache_audio(text, audio_bytes)
        
        return modal.web.Response(
            body=audio_bytes,
            headers={"Content-Type": "audio/wav"},
        )
        
    except Exception as e:
        logger.error(f"Error in synthesize: {e}")
        return {"error": str(e)}, 500


@app.function(
    image=image,
    volumes={"/models": model_volume},
    timeout=60,
)
@modal.web_endpoint(method="GET", label="health")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": model_loaded,
        "timestamp": datetime.now().isoformat(),
    }


@app.function(
    image=image,
    volumes={"/models": model_volume},
    timeout=60,
)
@modal.web_endpoint(method="GET", label="fetch-news")
def fetch_news():
    """Fetch news from Ada Derana."""
    try:
        from news_scraper import scrape_adaderana
        result = scrape_adaderana()
        return result
    except Exception as e:
        logger.error(f"Error fetching news: {e}")
        return {"success": False, "error": str(e), "items": []}, 500


@app.local_entrypoint()
def main():
    """Local entrypoint for testing."""
    print("Modal app deployed! Use the web endpoints:")
    print("- POST /synthesize - Synthesize text to speech")
    print("- GET /health - Health check")
    print("- GET /fetch-news - Fetch news headlines")


# Function to upload model files to Modal volume
@app.function(
    image=image,
    volumes={"/models": model_volume},
    timeout=3600,  # 1 hour for model upload
)
def upload_model():
    """Upload model files to Modal volume."""
    import subprocess
    
    # Download model from Hugging Face if not present
    model_dir = Path("/models")
    model_dir.mkdir(exist_ok=True)
    
    model_file = model_dir / "Nipunika_210000.pth"
    config_file = model_dir / "Nipunika_config.json"
    
    if not model_file.exists():
        logger.info("Downloading model from Hugging Face...")
        # Use huggingface_hub to download
        try:
            from huggingface_hub import hf_hub_download
            model_path = hf_hub_download(
                repo_id="dialoglk/SinhalaVITS-TTS-F1",
                filename="Nipunika_210000.pth",
                local_dir="/models",
            )
            logger.info(f"Model downloaded to {model_path}")
        except Exception as e:
            logger.error(f"Failed to download model: {e}")
            return {"error": str(e)}
    
    if not config_file.exists():
        logger.info("Downloading config from Hugging Face...")
        try:
            from huggingface_hub import hf_hub_download
            config_path = hf_hub_download(
                repo_id="dialoglk/SinhalaVITS-TTS-F1",
                filename="Nipunika_config.json",
                local_dir="/models",
            )
            logger.info(f"Config downloaded to {config_path}")
        except Exception as e:
            logger.error(f"Failed to download config: {e}")
            return {"error": str(e)}
    
    # Commit volume changes
    model_volume.commit()
    
    return {"success": True, "message": "Model files uploaded to volume"}

