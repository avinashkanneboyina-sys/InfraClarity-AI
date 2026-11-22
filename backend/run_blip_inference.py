import os
import time
import hashlib
from pathlib import Path
import torch
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration

# Paths
BASE_DIR = Path(__file__).resolve().parents[1]  # backend directory parent is project root
MODEL_DIR = BASE_DIR / 'backend' / 'models' / 'blip'
SAMPLE_IMG = BASE_DIR / 'backend' / 'sample_images' / 'pipeline_lowlight.jpg'

def file_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

def main():
    # Verify model files exist and non‑zero size
    # The HuggingFace hub stores the files inside a snapshot subdirectory.
    # Find the unique snapshot folder under the cache.
    snapshot_root = next((MODEL_DIR / 'models--Salesforce--blip-image-captioning-base' / 'snapshots').iterdir())
    required_files = ['config.json', 'pytorch_model.bin', 'tokenizer_config.json', 'preprocessor_config.json', 'vocab.txt']
    missing = []
    zero = []
    for f in required_files:
        p = snapshot_root / f
        if not p.is_file():
            missing.append(str(p))
        elif p.stat().st_size == 0:
            zero.append(str(p))
    if missing or zero:
        print('Model files problem:')
        if missing:
            print('  missing:', missing)
        if zero:
            print('  zero‑size:', zero)
        return
    print('All model files present and non‑empty in snapshot folder:', snapshot_root)


    # Load processor and model
    processor = BlipProcessor.from_pretrained(str(snapshot_root))
    model = BlipForConditionalGeneration.from_pretrained(str(snapshot_root))
    model.to('cpu')
    model.eval()
    print('Model loaded from local path.')

    # Prepare image
    img = Image.open(SAMPLE_IMG).convert('RGB')
    orig_hash = file_hash(SAMPLE_IMG)

    inputs = processor(images=img, return_tensors='pt')
    start = time.time()
    generated_ids = model.generate(**inputs, max_length=30)
    elapsed_ms = (time.time() - start) * 1000
    caption = processor.decode(generated_ids[0], skip_special_tokens=True)

    # Verify image unchanged
    new_hash = file_hash(SAMPLE_IMG)
    unchanged = orig_hash == new_hash

    # Output results
    result = {
        'caption': caption,
        'weights_loaded': True,
        'inference_executed': True,
        'device': 'cpu',
        'processing_time_ms': round(elapsed_ms, 2),
        'image_unchanged': unchanged,
    }
    print('--- BLIP Inference Result ---')
    for k, v in result.items():
        print(f"{k}: {v}")

if __name__ == '__main__':
    main()
