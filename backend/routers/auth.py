from fastapi import APIRouter, HTTPException, Depends, status
from backend.models.user import UserCreate, UserLogin
from backend.utils.auth import hash_password, verify_password, create_access_token, get_current_user
from backend.database import fetch_one

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(data: UserCreate):
    if data.password != data.password_confirm:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Пароли не совпадают",
        )

    existing = await fetch_one(
        "SELECT id FROM users WHERE email = $1 OR nickname = $2",
        data.email,
        data.nickname,
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким email или никнеймом уже существует",
        )

    hashed = hash_password(data.password)
    user = await fetch_one(
        """
        INSERT INTO users (nickname, email, password_hash, role, bio)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, nickname, email, role, bio, avatar_url, created_at
        """,
        data.nickname,
        data.email,
        hashed,
        data.role,
        data.bio,
    )

    token = create_access_token({"sub": str(user["id"])})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "nickname": user["nickname"],
            "email": user["email"],
            "role": user["role"],
            "bio": user["bio"],
            "avatar_url": user["avatar_url"] or "",
            "created_at": user["created_at"].isoformat(),
        },
    }


@router.post("/login")
async def login(data: UserLogin):
    user = await fetch_one(
        "SELECT id, nickname, email, password_hash, role, bio, avatar_url, created_at FROM users WHERE email = $1",
        data.email,
    )
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
        )

    token = create_access_token({"sub": str(user["id"])})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "nickname": user["nickname"],
            "email": user["email"],
            "role": user["role"],
            "bio": user["bio"],
            "avatar_url": user["avatar_url"] or "",
            "created_at": user["created_at"].isoformat(),
        },
    }


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "nickname": current_user["nickname"],
        "email": current_user["email"],
        "role": current_user["role"],
        "bio": current_user["bio"],
        "avatar_url": current_user["avatar_url"] or "",
        "created_at": current_user["created_at"].isoformat(),
    }
