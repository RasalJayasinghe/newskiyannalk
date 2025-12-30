#!/usr/bin/env python3
"""
Flask API for SinhalaVITS-TTS-F1 Text-to-Speech Service
Provides endpoints for synthesizing Sinhala text to speech.
"""

import os
import io
import re
import logging
import hashlib
from datetime import datetime, timedelta
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from TTS.utils.synthesizer import Synthesizer
from romanizer import sinhala_to_roman
import torch
from news_scraper import scrape_adaderana

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Model paths
MODEL_PATH = "Nipunika_210000.pth"
CONFIG_PATH = "Nipunika_config.json"

# Global synthesizer variable
synth = None
model_loaded = False
model_error = None

# Simple in-memory cache for TTS audio
# Format: {text_hash: (audio_bytes, timestamp)}
audio_cache = {}
CACHE_EXPIRY_HOURS = 24  # Cache expires after 24 hours

# Sinhala Unicode range: U+0D80 to U+0DFF
SINHALA_UNICODE_RANGE = re.compile(r'[\u0D80-\u0DFF\s\.,!?;:\-\(\)\[\]"]+')


def load_model():
    """Load the TTS model with error handling."""
    global synth, model_loaded, model_error
    
    if model_loaded:
        return True
    
    try:
        # Check if model files exist
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
        model_error = None
        logger.info("Model loaded successfully!")
        return True
        
    except Exception as e:
        model_error = str(e)
        logger.error(f"Failed to load model: {model_error}")
        return False


def validate_sinhala_text(text):
    """
    Validate that the text contains Sinhala characters.
    
    Args:
        text: Text to validate
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if not text or not text.strip():
        return False, "Text is empty or contains only whitespace"
    
    # Remove whitespace and punctuation for validation
    text_clean = re.sub(r'[\s\.,!?;:\-\(\)\[\]"]+', '', text)
    
    if not text_clean:
        return False, "Text contains only whitespace and punctuation"
    
    # Check if text contains Sinhala Unicode characters (U+0D80 to U+0DFF)
    has_sinhala = bool(re.search(r'[\u0D80-\u0DFF]', text))
    
    if not has_sinhala:
        # Check if it contains non-ASCII characters that aren't Sinhala
        has_non_ascii = bool(re.search(r'[^\x00-\x7F]', text))
        if has_non_ascii:
            return False, "Text contains non-Sinhala characters. Please provide text in Sinhala Unicode."
        else:
            # Pure ASCII/English text - reject it
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
        # Check if cache is still valid
        if datetime.now() - timestamp < timedelta(hours=CACHE_EXPIRY_HOURS):
            logger.info(f"Cache hit for text hash: {text_hash[:8]}...")
            return audio_bytes
        else:
            # Remove expired cache
            del audio_cache[text_hash]
            logger.info(f"Cache expired for text hash: {text_hash[:8]}...")
    return None


def cache_audio(text, audio_bytes):
    """Cache audio bytes with timestamp"""
    text_hash = get_text_hash(text)
    audio_cache[text_hash] = (audio_bytes, datetime.now())
    logger.info(f"Cached audio for text hash: {text_hash[:8]}... (Cache size: {len(audio_cache)})")


@app.route('/api/fetch-news', methods=['GET'])
def fetch_news():
    """
    Fetch news headlines from Ada Derana.
    
    Returns:
        JSON response with news items array
    """
    try:
        logger.info("Fetching news from Ada Derana...")
        news_items = scrape_adaderana()
        
        return jsonify({
            "success": True,
            "count": len(news_items),
            "items": news_items,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching news: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Failed to fetch news",
            "details": str(e),
            "items": []
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint to verify server status.
    
    Returns:
        JSON response with server status
    """
    try:
        # Try to load model if not loaded
        if not model_loaded:
            load_model()
        
        status = {
            "status": "healthy",
            "model_loaded": model_loaded,
            "timestamp": datetime.now().isoformat()
        }
        
        if model_error:
            status["error"] = model_error
            status["status"] = "degraded"
        
        return jsonify(status), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500


@app.route('/api/synthesize', methods=['POST'])
def synthesize():
    """
    Synthesize Sinhala text to speech.
    
    Request body (JSON):
        {
            "text": "සිංහල පාඨය"
        }
    
    Returns:
        WAV audio file or JSON error response
    """
    try:
        # Check if model is loaded
        if not model_loaded:
            if not load_model():
                return jsonify({
                    "error": "Model failed to load",
                    "details": model_error
                }), 500
        
        # Get request data
        if not request.is_json:
            return jsonify({
                "error": "Request must be JSON",
                "details": "Content-Type must be application/json"
            }), 400
        
        try:
            data = request.get_json()
        except Exception as e:
            return jsonify({
                "error": "Invalid JSON",
                "details": f"Failed to parse JSON: {str(e)}"
            }), 400
        
        if not data:
            return jsonify({
                "error": "Empty request body",
                "details": "Request body must contain a JSON object"
            }), 400
        
        # Extract text
        text = data.get("text", "").strip()
        
        # Validate text
        is_valid, error_msg = validate_sinhala_text(text)
        if not is_valid:
            return jsonify({
                "error": "Invalid text input",
                "details": error_msg
            }), 400
        
        logger.info(f"Received synthesis request for text: {text[:50]}...")
        
        # Check cache first
        cached_audio = get_cached_audio(text)
        if cached_audio:
            audio_buffer = io.BytesIO(cached_audio)
            audio_buffer.seek(0)
            logger.info("Returning cached audio")
            return send_file(
                audio_buffer,
                mimetype="audio/wav",
                as_attachment=True,
                download_name="synthesized.wav"
            )
        
        # Convert Sinhala text to Romanized text
        try:
            roman_text = sinhala_to_roman(text)
            logger.info(f"Romanized text: {roman_text[:50]}...")
        except Exception as e:
            logger.error(f"Romanization failed: {str(e)}")
            return jsonify({
                "error": "Text romanization failed",
                "details": str(e)
            }), 500
        
        # Generate audio
        try:
            wav = synth.tts(roman_text)
        except Exception as e:
            logger.error(f"TTS generation failed: {str(e)}")
            return jsonify({
                "error": "Audio generation failed",
                "details": str(e)
            }), 500
        
        # Create in-memory audio file (temporary, not saved to disk)
        audio_buffer = io.BytesIO()
        synth.save_wav(wav, audio_buffer)
        audio_buffer.seek(0)
        
        # Cache the audio
        audio_bytes = audio_buffer.getvalue()
        cache_audio(text, audio_bytes)
        audio_buffer.seek(0)  # Reset for sending
        
        # Return audio file directly from memory (no disk write)
        return send_file(
            audio_buffer,
            mimetype="audio/wav",
            as_attachment=True,
            download_name="synthesized.wav"
        )
        
    except Exception as e:
        logger.error(f"Unexpected error in synthesize endpoint: {str(e)}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({
        "error": "Endpoint not found",
        "available_endpoints": [
            "GET /api/health",
            "GET /api/fetch-news",
            "POST /api/synthesize"
        ]
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors."""
    return jsonify({
        "error": "Method not allowed"
    }), 405


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors."""
    return jsonify({
        "error": "Internal server error",
        "details": "An unexpected error occurred"
    }), 500


if __name__ == "__main__":
    # Load model on startup
    logger.info("Starting Flask API server...")
    if load_model():
        logger.info("Server ready!")
    else:
        logger.warning("Server starting but model failed to load. Check /api/health for status.")
    
    # Run the app
    app.run(
        host="0.0.0.0",
        port=8000,
        debug=False  # Set to False in production
    )

