import os
from pathlib import Path
from huggingface_hub import hf_hub_download

def download_blip(model_name='Salesforce/blip-image-captioning-base', cache_dir=None):
    """Download BLIP image captioning base model and tokenizer files.
    Saves them into backend/models/blip/.
    """
    if cache_dir is None:
        cache_dir = Path(__file__).parent / 'models' / 'blip'
    else:
        cache_dir = Path(cache_dir)
    os.makedirs(cache_dir, exist_ok=True)
    # The model consists of a config, pytorch_model.bin and tokenizer files.
    files = ['config.json', 'pytorch_model.bin', 'tokenizer_config.json', 'preprocessor_config.json', 'vocab.txt']
    for file_name in files:
        try:
            local_path = hf_hub_download(repo_id=model_name, filename=file_name, cache_dir=str(cache_dir))
            # move to cache_dir root (hf_hub_download caches under subfolder, we just ensure it's there)
        except Exception as e:
            print(f'Error downloading {file_name}: {e}')
            raise
    print(f'BLIP model files downloaded to {cache_dir}')

if __name__ == '__main__':
    download_blip()
