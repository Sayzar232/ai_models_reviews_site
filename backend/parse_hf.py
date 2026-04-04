import asyncio
import aiohttp
import re
from backend.database import create_pool, close_pool, execute

# Exclude models if they have these markers in their ID
LARGE_MODEL_MARKERS = [
    r"70b", r"72b", r"110b", r"65b", r"405b", r"104b", r"8x22b", r"8x7b", r"mixtral", 
    r"34b", r"35b", r"130b", r"175b", r"314b"
]

def format_approx_params(model_id: str) -> float:
    match = re.search(r"(\d+(?:\.\d+)?)[bB][^a-zA-Z]", model_id + "-")
    if match:
        return float(match.group(1))
    return 0.0

async def parse_hf_models():
    pool = await create_pool()
    url = "https://huggingface.co/api/models?pipeline_tag=text-generation&sort=downloads&direction=-1&limit=500"
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                print(f"Failed to fetch from HuggingFace, status: {response.status}")
                return
            models_data = await response.json()
            
    filtered_models = []
    
    for m in models_data:
        model_id = m.get("id", "")
        # Filter out large models based on regex
        if any(re.search(marker, model_id.lower()) for marker in LARGE_MODEL_MARKERS):
            continue
            
        repo_parts = model_id.split("/")
        author = repo_parts[0] if len(repo_parts) > 1 else ""
        name = repo_parts[-1]
        
        # Try to parse exact params (approximate from name)
        params = format_approx_params(model_id)
        
        # We need a fallback if it somehow slipped: maybe it's too big
        if params >= 32.0:
            continue
            
        downloads = m.get("downloads", 0)
        website_url = f"https://huggingface.co/{model_id}"
        
        # For HF logos, often it's https://huggingface.co/front/assets/huggingface_logo.svg or we can use avatars
        # We can construct avatar URL
        # Avatar URL structure: https://aeiljuispo.cloudimg.io/v7/https://cdn-uploads.huggingface.co/production/uploads/.... OR we can just use GitHub avatar for the org if we wanted, but HF doesn't expose it easily in this API. Let's use a default generator, like clearbit or leave blank.
        # Actually HF org avatarts can be fetched: https://huggingface.co/avatars/{author}.svg (Wait, some might have custom. Let's leave it blank or default to HF icon if we want)
        logo_url = f"https://huggingface.co/avatars/{author}.svg" if author else ""
        
        filtered_models.append({
            "name": name,
            "slug": model_id.replace("/", "-").lower(),
            "author": author,
            "description": f"Открытая модель {model_id} от {author}. Предназначена для генерации текста.",
            "website_url": website_url,
            "logo_url": logo_url,
            "parameters_approx": params,
            "downloads": downloads
        })
        
        if len(filtered_models) >= 200:
            break
            
    print(f"Found {len(filtered_models)} matching models.")
    
    for m in filtered_models:
        await execute(
            """
            INSERT INTO local_models (name, slug, author, description, website_url, logo_url, parameters_approx, downloads)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (slug) DO UPDATE SET 
                downloads = EXCLUDED.downloads,
                parameters_approx = EXCLUDED.parameters_approx
            """,
            m["name"], m["slug"], m["author"], m["description"], m["website_url"], m["logo_url"], m["parameters_approx"], m["downloads"]
        )
        
    print("Models inserted/updated successfully.")
    await close_pool()

if __name__ == "__main__":
    asyncio.run(parse_hf_models())
