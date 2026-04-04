import requests
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

LOGO_DEV_TOKEN = os.getenv("LOGO_DEV_TOKEN")

url = "https://openrouter.ai/api/v1/models"

providers = ["qwen", "z-ai", "x-ai", "google", "minimax", "openai", "anthropic", "mistralai", "nvidia", "moonshotai", "deepseek"]
models_information = []
# дата отсечки: 1 января 2025
cutoff = datetime(2025, 9, 1).timestamp()

def get_models():
    response = requests.get(url)
    models = response.json()["data"]

    new_models = [
        m for m in models
        if m.get("created", 0) >= cutoff and m.get("id", "").split("/")[0] in providers and m.get("architecture", "").get("output_modalities")[0] == "text"
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
        "qwen": f"https://img.logo.dev/qwen.ai?token={LOGO_DEV_TOKEN}",
        "z-ai": f"https://img.logo.dev/chat.z.ai?token={LOGO_DEV_TOKEN}",
        "x-ai": f"https://img.logo.dev/grok.com?token={LOGO_DEV_TOKEN}",
        "google": f"https://img.logo.dev/gemini.google.com?token={LOGO_DEV_TOKEN}",
        "minimax": f"https://img.logo.dev/minimax.io?token={LOGO_DEV_TOKEN}",
        "openai": f"https://img.logo.dev/openai.com?token={LOGO_DEV_TOKEN}",
        "anthropic": f"https://img.logo.dev/claude.ai?token={LOGO_DEV_TOKEN}",
        "mistralai": f"https://img.logo.dev/mistral.ai?token={LOGO_DEV_TOKEN}",
        "nvidia": f"https://img.logo.dev/nvidia.com?token={LOGO_DEV_TOKEN}",
        "moonshotai": f"https://img.logo.dev/moonshot.ai?token={LOGO_DEV_TOKEN}",
        "deepseek": f"https://img.logo.dev/deepseek.com?token={LOGO_DEV_TOKEN}",
    }
    return provider_logos.get(provider, "")