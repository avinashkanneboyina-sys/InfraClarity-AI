import sys, os
sys.path.append(r'C:\Users\avina\.gemini\antigravity\scratch\infraclarity-ai')
from backend.super_resolution import get_realesrgan_model
model, loaded = get_realesrgan_model()
print('weights_loaded:', loaded, 'model is', type(model))
