import os, time, hashlib
import cv2
import numpy as np
import torch

# Add project root to path
project_root = r'C:\Users\avina\.gemini\antigravity\scratch\infraclarity-ai'
import sys
sys.path.append(project_root)

from backend.super_resolution import get_realesrgan_model, _tiled_real_esrgan_forward

# Helper to compute hash
def file_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

samples_dir = os.path.join(project_root, 'backend', 'sample_images')
output_dir = os.path.join(project_root, 'backend', 'outputs')
os.makedirs(output_dir, exist_ok=True)

images = [
    'transmission_tower_blur.jpg',
    'pipeline_lowlight.jpg',
    'powerline_noise.jpg',
    'substation_lowcontrast.jpg'
]

for img_name in images:
    in_path = os.path.join(samples_dir, img_name)
    img = cv2.imread(in_path)
    if img is None:
        print(f'Failed to read {in_path}')
        continue
    h, w = img.shape[:2]
    start = time.time()
    model, weights_loaded = get_realesrgan_model(scale=4, device='cpu')
    if not weights_loaded or model is None:
        print('Model not loaded for', img_name)
        continue
    out = _tiled_real_esrgan_forward(model, img, device='cpu')
    elapsed = (time.time() - start) * 1000
    out_path = os.path.join(output_dir, f'enh_{os.path.splitext(img_name)[0]}_realesrgan.png')
    cv2.imwrite(out_path, out)
    dh, dw = out.shape[:2]
    print(f'Image: {img_name}')
    print(f'  Input dims: {w}x{h}')
    print(f'  Output dims: {dw}x{dh}')
    print(f'  Expected dims: {w*4}x{h*4}')
    print(f'  Weights loaded: {weights_loaded}')
    print(f'  Inference time ms: {elapsed:.2f}')
    print(f'  Fallback used: False')
    print(f'  Output path: {out_path}')
    print(f'  Input hash: {file_hash(in_path)}')
    print(f'  Output hash: {file_hash(out_path)}')
    print('---')
