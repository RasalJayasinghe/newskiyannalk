from flask import Flask, request, send_file, jsonify
from TTS.utils.synthesizer import Synthesizer
from romanizer import sinhala_to_roman
import io
from datetime import datetime
import torch

# Model paths
MODEL_PATH = "Nipunika_210000.pth"
CONFIG_PATH = "Nipunika_config.json"

# Init Flask app
app = Flask(__name__)

# Load model (use CUDA if available)
use_cuda = torch.cuda.is_available()
synth = Synthesizer(tts_checkpoint=MODEL_PATH, tts_config_path=CONFIG_PATH, use_cuda=use_cuda)

@app.route("/tts", methods=["POST"])
def tts():
    """POST JSON: { "text": "<Sinhala text>" }"""
    data = request.get_json()
    sinhala_text = (data.get("text") or "").strip()
    if not sinhala_text:
        return jsonify({"error": "No text provided"}), 400

    # Romanize Sinhala text
    roman_text = sinhala_to_roman(sinhala_text)

    # Generate audio
    wav = synth.tts(roman_text)
    out = io.BytesIO()
    synth.save_wav(wav, out)
    out.seek(0)

    # Optional local save (timestamped)
    filename = f"tts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.wav"
    synth.save_wav(wav, filename)

    # Return WAV directly
    return send_file(out, mimetype="audio/wav", as_attachment=True, download_name="output.wav")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
