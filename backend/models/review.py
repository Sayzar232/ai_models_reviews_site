from pydantic import BaseModel, Field
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ReviewCreate(BaseModel):
    overall_score: float = Field(..., ge=0, le=10)
    score_coding: float = Field(..., ge=0, le=10)
    score_speed: float = Field(..., ge=0, le=10)
    score_price: float = Field(..., ge=0, le=10)
    score_availability: float = Field(..., ge=0, le=10)
    score_creativity: float = Field(..., ge=0, le=10)
    score_accuracy: float = Field(..., ge=0, le=10)
    text: str = Field(..., min_length=50)
    tags: list[str] = Field(default_factory=list)


class ReviewAuthor(BaseModel):
    id: int
    nickname: str
    role: str
    avatar_url: str


class ReviewPublic(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    
    id: int
    user_id: int
    model_id: int
    overall_score: float
    score_coding: float
    score_speed: float
    score_price: float
    score_availability: float
    score_creativity: float
    score_accuracy: float
    text: str
    tags: list[str]
    likes_count: int = 0
    dislikes_count: int = 0
    user_vote: int = 0
    created_at: datetime
    author: ReviewAuthor | None = None

class ReviewVote(BaseModel):
    vote: int = Field(..., description="1 for like, -1 for dislike, 0 to remove vote")


class ReviewsPage(BaseModel):
    reviews: list[ReviewPublic]
    total: int
    page: int
    limit: int
    pages: int
