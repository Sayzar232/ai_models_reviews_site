import requests
from bs4 import BeautifulSoup
import os
from huggingface_hub import list_models
import re

def check_for_params_in_name(model_id):
    match = re.search(r"(\d+(?:\.\d+)?)([bm])", model_id.lower())
    if match:
        value = float(match.group(1))
        unit = match.group(2)
        if unit == 'b':
            return int(value * 1_000_000_000)
        elif unit == 'm':
            return int(value * 1_000_000)
    return None


def convert_params(params):
    if params:
        if params >= 1_000_000_000:
            return f"{params // 1_000_000_000}B"
        elif params >= 1_000_000:
            return f"{params // 1_000_000}M"
    return "?B"


def get_hf_models():
    text_models = list_models(
        sort="downloads",
        limit=250,
        expand=["safetensors"],  # <-- явно запрашиваем safetensors-метаданные,
        filter="text-generation"
    )
    image_and_text_models = list_models(
        sort="downloads",
        limit=250,
        expand=["safetensors"],  # <-- явно запрашиваем safetensors-метаданные,
        filter="image-text-to-text"
    )
    models = [*text_models, *image_and_text_models]
    models.sort(key=lambda x: x.downloads, reverse=True)
    models_list = []
    seen_model_names = set()

    for model in models:
        model_name = model.id.split('/')[-1].lower()
        if model_name not in seen_model_names:
            seen_model_names.add(model_name)
            models_list.append(model)

    for model in models_list[:500]:
        if model.safetensors:
            params = model.safetensors.total
        else:
            params = check_for_params_in_name(model.id)
        if params is None:
            continue
        if params < 121_000_000_000:
            print(f"{model.id.split('/')[0]}: {model.id.split('/')[1]} {convert_params(params)} {model.downloads}")

    print(len(models_list))
    print({i.id.split('/')[0] for i in models_list[:500]})
    providers_lst = {i.id.split('/')[0] for i in models_list[:200]}
    for provider in providers_lst:
        if not os.path.exists(f'frontend/images/models_logos/{provider}.png'):
            parse_and_save_logo_image(provider)
    return models_list


def parse_and_save_logo_image(provider):
    url = f"https://huggingface.co/{provider}"
    # find image with class "h-full w-full rounded-lg object-cover" and save it to images/{provider}.png
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    logo = soup.find('img', {'class': 'h-full w-full rounded-lg object-cover'})
    try:
        if logo:
            with open(f'frontend/images/models_logos/{provider}.png', 'wb') as f:
                f.write(requests.get(logo.get("src")).content)
        else:
            print(f"Logo not found for {provider}")
    except Exception as e:
        print(f"Error with provider {provider}: {e}")