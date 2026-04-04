from pydantic import BaseModel
from datetime import datetime


class AIModelBase(BaseModel):
    id: int
    name: str
    slug: str
    logo_url: str
    description: str
    website_url: str
    created_at: datetime


class AIModelStats(BaseModel):
    avg_overall: float = 0
    avg_coding: float = 0
    avg_speed: float = 0
    avg_price: float = 0
    avg_availability: float = 0
    avg_creativity: float = 0
    avg_accuracy: float = 0
    review_count: int = 0


class AIModelList(AIModelBase):
    stats: AIModelStats = AIModelStats()


class AIModelDetail(AIModelBase):
    stats: AIModelStats = AIModelStats()
