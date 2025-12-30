---
license: mpl-2.0
language:
- si
tags:
- si
- lk
- dialog
- tts
- uom
- vits
- female
---

# SinhalaVITS-TTS-F1 - Female Voice 01
This is a specially trained Coqui TTS [Coqui TTS](https://github.com/coqui-ai/TTS) model specially for **Sinhala**, developed by **Dialog Axiata PLC** and the **Dialog – UoM Research Lab**. 

We trained it on a custom recorded dataset adapting a clear female voice.

---
## Features
- Model architecture: VITS
- Language: Sinhala (si-lk)
- Training Sampling rate: 22050 Hz
- Framework: Coqui TTS
---

## Dataset
- Voice: Female (Nipunika)
- Recording Sampling Rate: 44100Hz
- No. of Clips: 1096
- Total Length: >100mins (~2 hrs.)

## Training Specs
- Hardware: NVidia GeForce GTX1060 6GB GPU
- Training Time: **~105 hours**
- Global Steps: 210,000
- Batch Size: 16
- Epochs:
- Loss Convergence: Stable mel + KL losses


## Installation

You can run this model locally using the included Flask-based inference server. This server will automatically use CUDA if it's available on your system. 

1. First install requirements.
   
   ```bash
    pip install -r requirements.txt
   ```
2. Then start the API server
   
  ```bash
    python inference_F2.py
  ```
  _This starts a Flask server at http://localhost:8000._

3. Then you can use curl or any HTTP client (like Postman) to send Sinhala text to the server.
   The API endpoint is '/tts'
  ```bash
    curl -X POST http://localhost:8000/tts \
       -H "Content-Type: application/json" \
       -d '{"text": "ආයුබෝවන්"}' \
       --output output.wav
  ```
4. This API will,
    * Convert Sinhala text → Romanized Sinhala (via romanizer.py)
    * Generate speech using the VITS model
    * Return output.wav (Sinhala voice)
      
## File Structure
  ```bash
    SinhalaVITS-TTS-M2/
      ├── Nipunika_190000.pth         # Fine-tuned VITS checkpoint
      ├── Nipunika_config.json        # Model configuration
      ├── romanizer.py                # Sinhala → Roman converter
      ├── inference_F1.py             # Flask-based inference server
      ├── requirements.txt            # Required dependencies
      ├── LICENSE                     # MPL-2.0 license
      └── README.md                   # This file
  ```
## Contributors

  * Kasun Ranasinghe (Dialog-UoM Reasearch Lab)
  * Randika Silva (Dialog Axiata PLC)
  * Vipula Wakkumbura (Dialog-UoM Reasearch Lab)

## Acknowledgements
  * PathNirvana (https://github.com/pathnirvana/coqui-tts) – Previous work in Sinhala TTS
  * Coqui TTS – Open-source TTS framework enabling the foundation of this work
  * Sinhala dataset contributor (Nipunika Maduwanthi) – for providing professional, quality speech samples

## License
This model is released under the MPL-2.0 license.