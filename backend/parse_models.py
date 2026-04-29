import requests
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

LOGO_DEV_TOKEN = os.getenv("LOGO_DEV_TOKEN")

url = "https://openrouter.ai/api/v1/models"

MIN_PARAMS_B = 200

providers = ["qwen", "z-ai", "x-ai", "google", "minimax", "openai", "anthropic", "mistralai", "nvidia", "moonshotai", "deepseek"]
models_information = []
# дата отсечки: 1 января 2025
cutoff = datetime(2025, 8, 1).timestamp()

def check_params_in_model_name(model):
    for i in range(1, MIN_PARAMS_B):
        if f"{i}B" in model or f"{i}b" in model:
            return False
    return True


def get_models():
    response = requests.get(url)
    models = response.json()["data"]

    new_models = [
        m for m in models
        if m.get("created", 0) >= cutoff and m.get("id", "").split("/")[0] in providers and m.get("architecture", "").get("output_modalities") == ["text"] and check_params_in_model_name(m["name"]) and check_params_in_model_name(m["id"])
    ]

    # сортируем по дате (новые сверху)
    new_models.sort(key=lambda x: x["created"], reverse=True)

    for m in new_models:
        created_date = datetime.fromtimestamp(m["created"])

        models_information.append(
            {
                "name": m["name"],
                "slug": m["id"].split("/")[1],
                "description": m.get("description", ""),
                "website_url": "",
                "logo_url": get_logo_url(m["id"].split("/")[0])
            }
        )

    return models_information


def get_logo_url(provider):
    provider_logos = {
        "qwen": f"images/qwen.jpg",
        "z-ai": f"images/z-ai.jpg",
        "x-ai": f"images/grok.png",
        "google": f"images/gemini.jpg",
        "minimax": f"images/minimax.jpg",
        "openai": f"images/openai.webp",
        "anthropic": f"images/claude.jpg",
        "mistralai": f"images/mistral.jpg",
        "nvidia": f"images/nvidia.jpg",
        "moonshotai": f"images/moonshot.png",
        "deepseek": f"images/deepseek.jpg",
    }
    return provider_logos.get(provider, "")