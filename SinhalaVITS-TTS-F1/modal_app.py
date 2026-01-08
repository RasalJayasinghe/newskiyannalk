"""
Modal deployment for SinhalaVITS-TTS-F1 Text-to-Speech Service
This script deploys the TTS model to Modal's cloud infrastructure.
"""

import os
import io
import re
import hashlib
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path

import modal

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Modal app and image setup
app = modal.App("sinhala-tts")  # Updated: embedded functions to fix import issues

# Create a volume to store the model files (persistent storage)
model_volume = modal.Volume.from_name("sinhala-tts-models", create_if_missing=True)

# Create a volume to cache news data (persistent storage)
news_cache_volume = modal.Volume.from_name("sinhala-tts-news-cache", create_if_missing=True)

# News cache file path
NEWS_CACHE_FILE = "/news_cache/latest_news.json"

# Define the image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git", "ffmpeg")
    .pip_install(
        "torch>=2.0.0",
        "TTS==0.20.0",
        "numpy",
        "soundfile",
        "pydub",
        "fastapi>=0.104.0",
        "beautifulsoup4>=4.12.0",
        "requests>=2.31.0",
        "lxml>=4.9.0",
        "huggingface-hub",
    )
    .env({"PYTHONPATH": "/root"})
)

# Embed news_scraper and romanizer functions directly to avoid mounting issues
# This ensures the code is always available in the Modal container

# Romanizer function (from romanizer.py)
def sinhala_to_roman(text):
    """Convert Sinhala text to Romanized text."""
    import re
    ro_specials = [['ඓ', 'ai'], ['ඖ', 'au'], ['ඍ', 'ṛ'], ['ඎ', 'ṝ'], ['ඐ', 'ḹ'], ['අ', 'a'], ['ආ', 'ā'], ['ඇ', 'æ'], ['ඈ', 'ǣ'], ['ඉ', 'i'], ['ඊ', 'ī'], ['උ', 'u'], ['ඌ', 'ū'], ['එ', 'e'], ['ඒ', 'ē'], ['ඔ', 'o'], ['ඕ', 'ō'], ['ඞ්', 'ṅ'], ['ං', 'ṁ'], ['ඃ', 'ḥ']]
    ro_consonants = [['ඛ', 'kh'], ['ඨ', 'ṭh'], ['ඝ', 'gh'], ['ඡ', 'ch'], ['ඣ', 'jh'], ['ඦ', 'ñj'], ['ඪ', 'ḍh'], ['ඬ', 'ṇḍ'], ['ථ', 'th'], ['ධ', 'dh'], ['ඵ', 'ph'], ['භ', 'bh'], ['ඹ', 'mb'], ['ඳ', 'ṉd'], ['ඟ', 'ṉg'], ['ඥ', 'gn'], ['ක', 'k'], ['ග', 'g'], ['ච', 'c'], ['ජ', 'j'], ['ඤ', 'ñ'], ['ට', 'ṭ'], ['ඩ', 'ḍ'], ['ණ', 'ṇ'], ['ත', 't'], ['ද', 'd'], ['න', 'n'], ['ප', 'p'], ['බ', 'b'], ['ම', 'm'], ['ය', 'y'], ['ර', 'r'], ['ල', 'l'], ['ව', 'v'], ['ශ', 'ś'], ['ෂ', 'ş'], ['ස', 's'], ['හ', 'h'], ['ළ', 'ḷ'], ['ෆ', 'f']]
    ro_combinations = [['', '', '්'], ['', 'a', ''], ['', 'ā', 'ා'], ['', 'æ', 'ැ'], ['', 'ǣ', 'ෑ'], ['', 'i', 'ි'], ['', 'ī', 'ී'], ['', 'u', 'ු'], ['', 'ū', 'ූ'], ['', 'e', 'ෙ'], ['', 'ē', 'ේ'], ['', 'ai', 'ෛ'], ['', 'o', 'ො'], ['', 'ō', 'ෝ'], ['', 'ṛ', 'ෘ'], ['', 'ṝ', 'ෲ'], ['', 'au', 'ෞ']]
    def create_conso_combi(combinations, consonants):
        conso_combi = []
        for combi in combinations:
            for conso in consonants:
                base_sinh = conso[0] + combi[2]
                base_rom = combi[0] + conso[1] + combi[1]
                conso_combi.append((base_sinh, base_rom))
        return conso_combi
    ro_conso_combi = create_conso_combi(ro_combinations, ro_consonants)
    def replace_all(text, mapping):
        mapping = sorted(mapping, key=lambda x: len(x[0]), reverse=True)
        for sinh, rom in mapping:
            text = re.sub(sinh, rom, text)
        return text
    text = text.replace("\u200D", "")
    text = replace_all(text, ro_conso_combi)
    text = replace_all(text, ro_specials)
    return text

# News scraper function (from news_scraper.py)  
def scrape_adaderana():
    """Scrape Ada Derana Sinhala hot news page."""
    import requests
    from bs4 import BeautifulSoup
    from datetime import datetime, timedelta
    import re
    
    ADA_DERANA_URL = "https://sinhala.adaderana.lk/sinhala-hot-news.php"
    news_items = []
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'si,en-US,en;q=0.9'}
        response = requests.get(ADA_DERANA_URL, headers=headers, timeout=15)
        response.raise_for_status()
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.content, 'html.parser')
        news_headings = soup.find_all('h2')
        
        for idx, heading in enumerate(news_headings[:50]):
            try:
                title = heading.get_text(strip=True)
                if not title or len(title) < 10 or title in ["උණුසුම් පුවත්", "Hot News", "Most Viewed"]:
                    continue
                parent = heading.find_parent(['div', 'article', 'section']) or heading
                link_elem = heading.find('a', href=True) or (parent.find('a', href=True) if parent else None)
                link = ""
                if link_elem:
                    link = link_elem.get('href', '')
                    if link and not link.startswith('http'):
                        link = f"https://sinhala.adaderana.lk{link}" if link.startswith('/') else f"https://sinhala.adaderana.lk/{link}"
                time_str = ""
                timestamp = None
                time_pattern = re.compile(r'(December|January|February|March|April|May|June|July|August|September|October|November)\s+\d+,\s+\d+\s+\d+:\d+\s+(am|pm)', re.I)
                search_area = parent if parent else heading
                time_text = search_area.get_text()
                time_match = time_pattern.search(time_text)
                if time_match:
                    time_str = time_match.group(0).strip()
                    timestamp = parse_time_string(time_str)
                category = "උණුසුම් පුවත්"
                is_breaking = any(word in title for word in ["විශේෂ", "බිඳී", "උත්තරීතර"])
                news_items.append({"id": idx + 1, "title": title, "link": link or f"{ADA_DERANA_URL}#{idx}", "time": time_str or "මෑතකදී", "timestamp": timestamp.isoformat() if timestamp else datetime.now().isoformat(), "category": category, "isBreaking": is_breaking, "text": title})
            except Exception as e:
                logger.warning(f"Error parsing article {idx}: {str(e)}")
                continue
        
        if not news_items:
            now = datetime.now()
            news_items = [{"id": 1, "title": "ශ්‍රී ලංකාවේ ආර්ථික ප්‍රතිසංස්කරණ", "link": "https://www.adaderana.lk/news/1", "time": "1:24 pm today", "timestamp": now.replace(hour=13, minute=24).isoformat(), "category": "ව්‍යාපාරික", "isBreaking": False, "text": "ශ්‍රී ලංකාවේ ආර්ථික ප්‍රතිසංස්කරණ"}]
        
        logger.info(f"Scraped {len(news_items)} news items")
        return {"success": True, "count": len(news_items), "items": news_items, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Error scraping: {str(e)}")
        return {"success": False, "error": str(e), "items": [], "count": 0, "timestamp": datetime.now().isoformat()}

def parse_time_string(time_str):
    """Parse time strings like 'December 30, 2025 2:15 pm'."""
    if not time_str:
        return None
    time_str = time_str.strip()
    now = datetime.now()
    date_time_match = re.search(r'(\w+)\s+(\d+),\s+(\d+)\s+(\d{1,2}):(\d{2})\s*(am|pm)', time_str, re.I)
    if date_time_match:
        month_name, day, year, hour, minute, ampm = date_time_match.groups()
        month_map = {'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6, 'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12}
        month = month_map.get(month_name.lower(), now.month)
        hour, minute = int(hour), int(minute)
        if ampm == "pm" and hour != 12:
            hour += 12
        elif ampm == "am" and hour == 12:
            hour = 0
        try:
            return datetime(int(year), month, int(day), hour, minute)
        except:
            pass
    time_str_lower = time_str.lower()
    if "today" in time_str_lower or "අද" in time_str:
        time_match = re.search(r'(\d{1,2}):(\d{2})\s*(am|pm)', time_str_lower)
        if time_match:
            hour, minute, ampm = int(time_match.group(1)), int(time_match.group(2)), time_match.group(3)
            if ampm == "pm" and hour != 12:
                hour += 12
            elif ampm == "am" and hour == 12:
                hour = 0
            return now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    hours_ago = re.search(r'(\d+)\s*(hour|hours|පැය)', time_str_lower)
    if hours_ago:
        return now - timedelta(hours=int(hours_ago.group(1)))
    minutes_ago = re.search(r'(\d+)\s*(minute|minutes|මිනිත්තු)', time_str_lower)
    if minutes_ago:
        return now - timedelta(minutes=int(minutes_ago.group(1)))
    if "yesterday" in time_str_lower or "ඊයේ" in time_str:
        return now - timedelta(days=1)
    return now

# Files are copied into the image at /root/, so imports will work in Modal container
# We don't import here to avoid errors during local development

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
model_load_error = None


def load_model():
    """Load the TTS model."""
    global synth, model_loaded, model_load_error
    
    if model_loaded:
        return True
    
    try:
        import os
        logger.info("Attempting to import TTS...")
        try:
            from TTS.utils.synthesizer import Synthesizer
            logger.info("TTS import successful")
        except ImportError as import_err:
            model_load_error = f"Failed to import TTS: {import_err}"
            logger.error(model_load_error)
            return False
        
        import torch
        logger.info(f"PyTorch version: {torch.__version__}")
        logger.info(f"CUDA available: {torch.cuda.is_available()}")
        
        if not os.path.exists(MODEL_PATH):
            model_load_error = f"Model file not found: {MODEL_PATH}"
            raise FileNotFoundError(model_load_error)
        
        if not os.path.exists(CONFIG_PATH):
            model_load_error = f"Config file not found: {CONFIG_PATH}"
            raise FileNotFoundError(model_load_error)
        
        logger.info(f"Loading model from {MODEL_PATH}...")
        use_cuda = torch.cuda.is_available()
        device = "cuda" if use_cuda else "cpu"
        logger.info(f"Using device: {device}")
        
        logger.info("Creating Synthesizer instance...")
        synth = Synthesizer(
            tts_checkpoint=MODEL_PATH,
            tts_config_path=CONFIG_PATH,
            use_cuda=use_cuda
        )
        logger.info("Synthesizer created successfully")
        
        model_loaded = True
        model_load_error = None
        logger.info("Model loaded successfully!")
        return True
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        model_load_error = f"{str(e)}\n{error_trace}"
        logger.error(f"Failed to load model: {e}")
        logger.error(f"Traceback: {error_trace}")
        print(f"ERROR loading model: {e}")
        print(f"Traceback: {error_trace}")
        return False


@app.function(
    image=image,
    gpu="T4",  # Use T4 GPU for faster inference (free tier supports T4)
    volumes={"/models": model_volume},
    timeout=300,  # 5 minute timeout
    min_containers=1,  # Keep 1 container warm to reduce cold starts
)
@modal.fastapi_endpoint(method="POST", label="synthesize")
async def synthesize(request_body: dict):
    """
    Synthesize Sinhala text to speech.
    
    Args:
        request_body: JSON request body with 'text' field
        
    Returns:
        Audio file as bytes
    """
    try:
        # Parse JSON body
        text = request_body.get("text", "") if isinstance(request_body, dict) else ""
        
        if not text:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                content={"error": "Text parameter is required"},
                status_code=400,
            )
        
        # Validate input
        is_valid, error_msg = validate_sinhala_text(text)
        if not is_valid:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                content={"error": error_msg},
                status_code=400,
            )
        
        # Check cache first
        cached_audio = get_cached_audio(text)
        if cached_audio:
            from fastapi.responses import Response
            return Response(
                content=cached_audio,
                media_type="audio/wav",
            )
        
        # Load model if not loaded
        try:
            load_result = load_model()
            if not load_result:
                from fastapi.responses import JSONResponse
                # Try to get more details about why loading failed
                import os
                model_exists = os.path.exists(MODEL_PATH)
                config_exists = os.path.exists(CONFIG_PATH)
                return JSONResponse(
                    content={
                        "error": "Failed to load TTS model",
                        "details": {
                            "model_path": MODEL_PATH,
                            "config_path": CONFIG_PATH,
                            "model_exists": model_exists,
                            "config_exists": config_exists,
                            "load_error": model_load_error if 'model_load_error' in globals() else "Unknown error"
                        }
                    },
                    status_code=500,
                )
        except Exception as load_err:
            from fastapi.responses import JSONResponse
            import traceback
            error_details = traceback.format_exc()
            logger.error(f"Exception during model loading: {load_err}")
            logger.error(f"Traceback: {error_details}")
            return JSONResponse(
                content={
                    "error": "Exception during model loading",
                    "details": str(load_err),
                    "traceback": error_details
                },
                status_code=500,
            )
        
        # Romanize Sinhala text (function is embedded above)
        try:
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
        
        from fastapi.responses import Response
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
        )
        
    except Exception as e:
        logger.error(f"Error in synthesize: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            content={"error": str(e)},
            status_code=500,
        )


@app.function(
    image=image,
    volumes={"/models": model_volume},
    timeout=60,
)
@modal.fastapi_endpoint(method="GET", label="health")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "model_loaded": model_loaded,
        "timestamp": datetime.now().isoformat(),
    }


def get_cached_news():
    """Read cached news from volume."""
    try:
        if os.path.exists(NEWS_CACHE_FILE):
            with open(NEWS_CACHE_FILE, 'r', encoding='utf-8') as f:
                cached_data = json.load(f)
                # Check if cache is still valid (less than 4 hours old)
                cache_timestamp = datetime.fromisoformat(cached_data.get('timestamp', datetime.now().isoformat()))
                age = datetime.now() - cache_timestamp
                if age < timedelta(hours=4):
                    logger.info(f"Returning cached news (age: {age})")
                    return cached_data
                else:
                    logger.info(f"Cache expired (age: {age}), will scrape fresh news")
        return None
    except Exception as e:
        logger.warning(f"Error reading cache: {e}")
        return None


def save_news_to_cache(news_data):
    """Save news data to cache volume."""
    try:
        os.makedirs(os.path.dirname(NEWS_CACHE_FILE), exist_ok=True)
        with open(NEWS_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(news_data, f, ensure_ascii=False, indent=2)
        # Commit the volume to persist changes
        news_cache_volume.commit()
        logger.info(f"News cached successfully: {len(news_data.get('items', []))} items")
    except Exception as e:
        logger.error(f"Error saving cache: {e}")


@app.function(
    image=image,
    volumes={"/models": model_volume, "/news_cache": news_cache_volume},
    timeout=60,
)
@modal.fastapi_endpoint(method="GET", label="fetch-news")
def fetch_news():
    """Fetch news from cache. Returns cached news if available, otherwise scrapes fresh."""
    try:
        # Try to get cached news first
        cached_news = get_cached_news()
        if cached_news:
            return cached_news
        
        # If no cache or cache expired, scrape fresh (fallback)
        logger.info("No valid cache found, scraping fresh news...")
        result = scrape_adaderana()
        if result.get("success"):
            save_news_to_cache(result)
        return result
    except Exception as e:
        logger.error(f"Error fetching news: {e}")
        return {"success": False, "error": str(e), "items": []}, 500


@app.function(
    image=image,
    volumes={"/news_cache": news_cache_volume},
    timeout=120,
    schedule=modal.Period(hours=3),  # Every 3 hours
)
def scheduled_news_scraper():
    """Scheduled function that runs every 3 hours to scrape and cache news."""
    try:
        logger.info("Scheduled news scraping started...")
        result = scrape_adaderana()
        if result.get("success"):
            save_news_to_cache(result)
            logger.info(f"Scheduled scraping completed: {result.get('count', 0)} items cached")
        else:
            logger.error(f"Scheduled scraping failed: {result.get('error', 'Unknown error')}")
        return result
    except Exception as e:
        logger.error(f"Error in scheduled news scraper: {e}")
        return {"success": False, "error": str(e)}


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
    from pathlib import Path
    
    print("Starting model upload...")
    logger.info("Starting model upload...")
    
    # Download model from Hugging Face if not present
    model_dir = Path("/models")
    model_dir.mkdir(exist_ok=True)
    
    model_file = model_dir / "Nipunika_210000.pth"
    config_file = model_dir / "Nipunika_config.json"
    
    print(f"Checking for model file: {model_file}")
    print(f"Model file exists: {model_file.exists()}")
    print(f"Checking for config file: {config_file}")
    print(f"Config file exists: {config_file.exists()}")
    
    if not model_file.exists():
        print("Downloading model from Hugging Face...")
        logger.info("Downloading model from Hugging Face...")
        # Use huggingface_hub to download
        try:
            from huggingface_hub import hf_hub_download
            model_path = hf_hub_download(
                repo_id="dialoglk/SinhalaVITS-TTS-F1",
                filename="Nipunika_210000.pth",
                local_dir="/models",
            )
            print(f"Model downloaded to {model_path}")
            logger.info(f"Model downloaded to {model_path}")
        except Exception as e:
            print(f"Failed to download model: {e}")
            logger.error(f"Failed to download model: {e}")
            return {"error": str(e)}
    else:
        print(f"Model file already exists at {model_file}")
    
    if not config_file.exists():
        print("Downloading config from Hugging Face...")
        logger.info("Downloading config from Hugging Face...")
        try:
            from huggingface_hub import hf_hub_download
            config_path = hf_hub_download(
                repo_id="dialoglk/SinhalaVITS-TTS-F1",
                filename="Nipunika_config.json",
                local_dir="/models",
            )
            print(f"Config downloaded to {config_path}")
            logger.info(f"Config downloaded to {config_path}")
        except Exception as e:
            print(f"Failed to download config: {e}")
            logger.error(f"Failed to download config: {e}")
            return {"error": str(e)}
    else:
        print(f"Config file already exists at {config_file}")
    
    # Verify files exist before committing
    if model_file.exists() and config_file.exists():
        print(f"Both files exist. Model size: {model_file.stat().st_size / (1024*1024):.2f} MB")
        print("Committing volume changes...")
        # Commit volume changes
        model_volume.commit()
        print("Volume committed successfully!")
        result = {"success": True, "message": "Model files uploaded to volume"}
        print(f"Result: {result}")
        return result
    else:
        error_msg = f"Files missing. Model exists: {model_file.exists()}, Config exists: {config_file.exists()}"
        print(error_msg)
        return {"error": error_msg}

