import pathlib, urllib.request, hashlib, sys
ckpt_dir = pathlib.Path(r'C:\\Users\\avina\\.gemini\\antigravity\\scratch\\infraclarity-ai\\backend\\models\\realesrgan')
ckpt_dir.mkdir(parents=True, exist_ok=True)
ckpt_path = ckpt_dir / 'RealESRGAN_x4plus.pth'
url = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth'
print('Downloading RealESRGAN_x4plus checkpoint...')
urllib.request.urlretrieve(url, str(ckpt_path))
print('Download finished. Size:', ckpt_path.stat().st_size, 'bytes')
print('SHA256:', hashlib.sha256(ckpt_path.read_bytes()).hexdigest())
