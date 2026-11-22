import sys, json
try:
    import torch
    info = {
        'torch_version': torch.__version__,
        'cuda_available': torch.cuda.is_available(),
        'gpu_name': torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
    }
except Exception as e:
    info = {'error': str(e)}
print(json.dumps(info))
