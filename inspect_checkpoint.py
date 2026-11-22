import torch, os, json, sys
ckpt_path = r'C:\Users\avina\.gemini\antigravity\scratch\infraclarity-ai\models\realesrgan\RealESRGAN_x4plus.pth'
if not os.path.isfile(ckpt_path):
    print('Checkpoint not found')
    sys.exit(1)
ck = torch.load(ckpt_path, map_location='cpu')
print('Checkpoint type:', type(ck))
if isinstance(ck, dict):
    print('Top-level keys:', list(ck.keys()))
    # try various common entries
    for key in ['state_dict', 'params_ema', 'params', 'model', 'model_state_dict']:
        if key in ck:
            sd = ck[key]
            print(f'Using key {key}, dict length:', len(sd))
            sample_keys = list(sd.keys())[:10]
            print('Sample keys:', sample_keys)
            break
    else:
        # assume ck itself is state dict
        sd = ck
        print('Assuming top-level dict is state dict, length:', len(sd))
        print('Sample keys:', list(sd.keys())[:10])
else:
    print('Checkpoint not a dict, maybe a Tensor')
