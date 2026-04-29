import asyncio
import aiohttp
import re
import os
from bs4 import BeautifulSoup
from huggingface_hub import list_models
from backend.database import create_pool, close_pool, execute

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

async def parse_and_save_logo_image_async(provider: str, session: aiohttp.ClientSession) -> str:
    img_path = f"frontend/images/models_logos/{provider}.png"
    if os.path.exists(img_path):
        return f"images/models_logos/{provider}.png"
        
    url = f"https://huggingface.co/{provider}"
    try:
        async with session.get(url) as response:
            if response.status == 200:
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                logo = soup.find('img', {'class': 'h-full w-full rounded-lg object-cover'})
                if logo and logo.get("src"):
                    img_url = logo.get("src")
                    async with session.get(img_url) as img_resp:
                        if img_resp.status == 200:
                            os.makedirs("frontend/images/models_logos", exist_ok=True)
                            with open(img_path, 'wb') as f:
                                f.write(await img_resp.read())
                            return f"images/models_logos/{provider}.png"
                else:
                    print(f"Logo not found for {provider}")
    except Exception as e:
        print(f"Error with provider {provider}: {e}")
        
    return ""

async def parse_hf_models():
    def fetch_models():
        text_models = list_models(
            sort="downloads",
            limit=250,
            expand=["safetensors"],
            filter="text-generation"
        )
        image_and_text_models = list_models(
            sort="downloads",
            limit=250,
            expand=["safetensors"],
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
                
        return models_list

    loop = asyncio.get_event_loop()
    top_models = await loop.run_in_executor(None, fetch_models)
    
    filtered_models = []
    async with aiohttp.ClientSession() as img_session:
        for model in top_models:
            model_id = model.id
            
            if model.safetensors:
                params_num = model.safetensors.total
            else:
                params_num = check_for_params_in_name(model_id)
                
            if params_num is None or params_num >= 121_000_000_000:
                continue

            repo_parts = model_id.split("/")
            author = repo_parts[0] if len(repo_parts) > 1 else ""
            
            name = f"{author}: {repo_parts[-1]}"
            params_approx = float(params_num) / 1_000_000_000
            
            downloads = getattr(model, "downloads", 0)
            website_url = f"https://huggingface.co/{model_id}"
            
            logo_url = ""
            if author:
                logo_url = await parse_and_save_logo_image_async(author, img_session)
            if not logo_url and author:
                logo_url = f"https://huggingface.co/avatars/{author}.svg"
            
            filtered_models.append({
                "name": name,
                "slug": model_id.replace("/", "-").lower(),
                "author": author,
                "description": f"Открытая модель {model_id} от {author}. Предназначена для генерации текста.",
                "website_url": website_url,
                "logo_url": logo_url,
                "parameters_approx": params_approx,
                "downloads": downloads
            })
            
    print(f"Found {len(filtered_models)} matching models.")
    
    for m in filtered_models:
        await execute(
            """
            INSERT INTO local_models (name, slug, author, description, website_url, logo_url, parameters_approx, downloads)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (slug) DO UPDATE SET 
                downloads = EXCLUDED.downloads,
                parameters_approx = EXCLUDED.parameters_approx,
                logo_url = EXCLUDED.logo_url
            """,
            m["name"], m["slug"], m["author"], m["description"], m["website_url"], m["logo_url"], m["parameters_approx"], m["downloads"]
        )
        
    print("Models inserted/updated successfully.")

if __name__ == "__main__":
    async def main():
        await create_pool()
        await parse_hf_models()
        await close_pool()

    asyncio.run(main())
