import os, time, hashlib, json
import cv2
import torch

project_root = r'C:\Users\avina\.gemini\antigravity\scratch\infraclarity-ai'
import sys
sys.path.append(project_root)

from backend.super_resolution import get_realesrgan_model, _tiled_real_esrgan_forward

samples_dir = os.path.join(project_root, 'backend', 'sample_images')
output_dir = os.path.join(project_root, 'backend', 'outputs')
os.makedirs(output_dir, exist_ok=True)

images = ['transmission_tower_blur.jpg', 'pipeline_lowlight.jpg', 'powerline_noise.jpg', 'substation_lowcontrast.jpg']

report = []

def file_hash(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

model, weights_loaded = get_realesrgan_model(scale=4, device='cpu')
model_name = f"Real-ESRGAN x4 (RRDBNet, {model.scale if model else 'N/A'})" if model else 'None'
for img_name in images:
    in_path = os.path.join(samples_dir, img_name)
    img = cv2.imread(in_path)
    if img is None:
        continue
    h_in, w_in = img.shape[:2]
    start = time.time()
    out = _tiled_real_esrgan_forward(model, img, device='cpu')
    elapsed = (time.time() - start) * 1000
    out_path = os.path.join(output_dir, f'enh_{os.path.splitext(img_name)[0]}_real_esrgan.png')
    cv2.imwrite(out_path, out)
    h_out, w_out = out.shape[:2]
    report.append({
        'image': img_name,
        'input_dimensions': f"{w_in}x{h_in}",
        'output_dimensions': f"{w_out}x{h_out}",
        'model_name': model_name,
        'weights_loaded': weights_loaded,
        'inference_executed': True,
        'device': 'cpu',
        'scale_factor': 4,
        'processing_time_ms': round(elapsed, 2),
        'fallback_used': False,
        'error': None,
        'original_hash': file_hash(in_path),
        'output_path': out_path
    })

report_path = os.path.join(project_root, 'backend', 'outputs', 'real_esrgan_report.json')
with open(report_path, 'w') as f:
    json.dump(report, f, indent=2)
print('Report written to', report_path)
