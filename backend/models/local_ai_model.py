from pydantic import BaseModel
from datetime import datetime

class LocalAIModelStats(BaseModel):
    avg_overall: float = 0
    avg_coding: float = 0
    avg_speed: float = 0
    avg_vram: float = 0
    avg_context: float = 0
    avg_creativity: float = 0
    avg_accuracy: float = 0
    review_count: int = 0

class LocalAIModelPublic(BaseModel):
    id: int
    name: str
    slug: str
    author: str
    description: str
    website_url: str
    logo_url: str
    parameters_approx: float
    downloads: int
    created_at: datetime
    stats: LocalAIModelStats | None = None
