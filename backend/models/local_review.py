from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from backend.models.review import ReviewAuthor

class LocalReviewCreate(BaseModel):
    overall_score: float = Field(..., ge=0, le=10)
    score_coding: float = Field(..., ge=0, le=10)
    score_speed: float = Field(..., ge=0, le=10)
    score_vram: float = Field(..., ge=0, le=10)
    score_context: float = Field(..., ge=0, le=10)
    score_creativity: float = Field(..., ge=0, le=10)
    score_accuracy: float = Field(..., ge=0, le=10)
    text: str = Field(..., min_length=50)
    tags: list[str] = Field(default_factory=list)

class LocalReviewPublic(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    id: int
    user_id: int
    model_id: int
    overall_score: float
    score_coding: float
    score_speed: float
    score_vram: float
    score_context: float
    score_creativity: float
    score_accuracy: float
    text: str
    tags: list[str]
    likes_count: int = 0
    dislikes_count: int = 0
    user_vote: int = 0
    created_at: datetime
    author: ReviewAuthor | None = None

class LocalReviewsPage(BaseModel):
    reviews: list[LocalReviewPublic]
    total: int
    page: int
    limit: int
    pages: int
