from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserCreate(BaseModel):
    nickname: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    password_confirm: str = Field(..., min_length=8, max_length=128)
    role: str = Field(default="обычный пользователь")
    bio: str = Field(default="", max_length=500)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: int
    nickname: str
    role: str
    bio: str
    avatar_url: str
    created_at: datetime
    review_count: int = 0


class UserMe(BaseModel):
    id: int
    nickname: str
    email: str
    role: str
    bio: str
    avatar_url: str
    created_at: datetime
