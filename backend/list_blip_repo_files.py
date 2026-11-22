from huggingface_hub import list_repo_files
files = list_repo_files('Salesforce/blip-image-captioning-base')
for f in files:
    print(f)