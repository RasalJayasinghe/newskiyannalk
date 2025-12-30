#!/bin/bash
# Script to download the SinhalaVITS-TTS-F1 model files
# These files are too large for Git, so they need to be downloaded separately

set -e

echo "Downloading SinhalaVITS-TTS-F1 model files..."

# Install Git LFS if not already installed
if ! command -v git-lfs &> /dev/null; then
    echo "Git LFS not found. Please install it first:"
    echo "  macOS: brew install git-lfs"
    echo "  Linux: sudo apt-get install git-lfs"
    exit 1
fi

# Model files from Hugging Face
MODEL_URL="https://huggingface.co/dialoglk/SinhalaVITS-TTS-F1/resolve/main"
MODEL_FILE="Nipunika_210000.pth"
CONFIG_FILE="Nipunika_config.json"

echo "Downloading model file (this may take a while, ~950MB)..."
curl -L "${MODEL_URL}/${MODEL_FILE}" -o "${MODEL_FILE}"

echo "Downloading config file..."
curl -L "${MODEL_URL}/${CONFIG_FILE}" -o "${CONFIG_FILE}"

echo "✅ Model files downloaded successfully!"
echo "Files:"
ls -lh "${MODEL_FILE}" "${CONFIG_FILE}"

