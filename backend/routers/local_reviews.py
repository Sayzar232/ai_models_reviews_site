import json
import math
from fastapi import APIRouter, HTTPException, Query, Depends, status
from backend.models.local_review import LocalReviewCreate, LocalReviewPublic, LocalReviewsPage
from backend.models.review import ReviewVote
from backend.utils.auth import get_current_user, get_current_user_optional
from backend.utils.ratings import recalculate_local_model_stats
from backend.database import fetch_one, fetch_all, execute

router = APIRouter(tags=["local-reviews"])

@router.get("/local-models/{model_id}/reviews")
async def get_local_reviews(
    model_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: dict | None = Depends(get_current_user_optional),
):
    model = await fetch_one("SELECT id FROM local_models WHERE id = $1", model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Модель не найдена")

    total_row = await fetch_one(
        "SELECT COUNT(*) as cnt FROM local_reviews WHERE model_id = $1", model_id
    )
    total = total_row["cnt"]
    pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    rows = await fetch_all(
        """
        SELECT r.id, r.user_id, r.model_id, r.overall_score, r.score_coding, r.score_speed,
               r.score_reasoning, r.score_context, r.score_instruction, r.score_accuracy,
               r.text, r.tags, r.likes_count, r.dislikes_count, r.created_at,
               u.nickname, u.role as user_role, u.avatar_url,
               COALESCE(v.vote, 0) as user_vote
        FROM local_reviews r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN local_review_votes v ON r.id = v.review_id AND v.user_id = $1
        WHERE r.model_id = $2
        ORDER BY r.likes_count DESC, r.created_at DESC
        LIMIT $3 OFFSET $4
        """,
        current_user["id"] if current_user else 0,
        model_id,
        limit,
        offset,
    )

    reviews = []
    for r in rows:
        tags = r["tags"] if isinstance(r["tags"], list) else json.loads(r["tags"]) if r["tags"] else []
        reviews.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "model_id": r["model_id"],
            "overall_score": float(r["overall_score"]),
            "score_coding": float(r["score_coding"]),
            "score_speed": float(r["score_speed"]),
            "score_reasoning": float(r["score_reasoning"]),
            "score_context": float(r["score_context"]),
            "score_instruction": float(r["score_instruction"]),
            "score_accuracy": float(r["score_accuracy"]),
            "text": r["text"],
            "tags": tags,
            "likes_count": r["likes_count"],
            "dislikes_count": r["dislikes_count"],
            "user_vote": r["user_vote"],
            "created_at": r["created_at"].isoformat(),
            "author": {
                "id": r["user_id"],
                "nickname": r["nickname"],
                "role": r["user_role"],
                "avatar_url": r["avatar_url"] or "",
            },
        })

    return {
        "reviews": reviews,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
    }


@router.post("/local-models/{model_id}/reviews", status_code=status.HTTP_201_CREATED)
async def create_local_review(
    model_id: int,
    data: LocalReviewCreate,
    current_user: dict = Depends(get_current_user),
):
    model = await fetch_one("SELECT id FROM local_models WHERE id = $1", model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Модель не найдена")

    existing = await fetch_one(
        "SELECT id FROM local_reviews WHERE user_id = $1 AND model_id = $2",
        current_user["id"],
        model_id,
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Вы уже оставили отзыв на эту модель",
        )

    tags_json = json.dumps(data.tags, ensure_ascii=False)
    review = await fetch_one(
        """
        INSERT INTO local_reviews (user_id, model_id, overall_score, score_coding, score_speed,
                             score_reasoning, score_context, score_instruction, score_accuracy,
                             text, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
        RETURNING id, user_id, model_id, overall_score, score_coding, score_speed,
                  score_reasoning, score_context, score_instruction, score_accuracy,
                  text, tags, created_at
        """,
        current_user["id"],
        model_id,
        data.overall_score,
        data.score_coding,
        data.score_speed,
        data.score_reasoning,
        data.score_context,
        data.score_instruction,
        data.score_accuracy,
        data.text,
        tags_json,
    )

    await recalculate_local_model_stats(model_id)

    tags = review["tags"] if isinstance(review["tags"], list) else json.loads(review["tags"]) if review["tags"] else []
    return {
        "id": review["id"],
        "user_id": review["user_id"],
        "model_id": review["model_id"],
        "overall_score": float(review["overall_score"]),
        "score_coding": float(review["score_coding"]),
        "score_speed": float(review["score_speed"]),
        "score_reasoning": float(review["score_reasoning"]),
        "score_context": float(review["score_context"]),
        "score_instruction": float(review["score_instruction"]),
        "score_accuracy": float(review["score_accuracy"]),
        "text": review["text"],
        "tags": tags,
        "likes_count": 0,
        "dislikes_count": 0,
        "user_vote": 0,
        "created_at": review["created_at"].isoformat(),
        "author": {
            "id": current_user["id"],
            "nickname": current_user["nickname"],
            "role": current_user["role"],
            "avatar_url": current_user["avatar_url"] or "",
        },
    }


@router.post("/local-reviews/{review_id}/vote")
async def vote_local_review(
    review_id: int,
    data: ReviewVote,
    current_user: dict = Depends(get_current_user),
):
    review = await fetch_one("SELECT id FROM local_reviews WHERE id = $1", review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")

    existing = await fetch_one(
        "SELECT vote FROM local_review_votes WHERE review_id = $1 AND user_id = $2",
        review_id, current_user["id"]
    )
    
    current_vote = existing["vote"] if existing else 0
    new_vote = data.vote
    
    if current_vote == new_vote:
        return {"success": True}
        
    likes_diff = 0
    dislikes_diff = 0
    
    if current_vote == 1:
        likes_diff -= 1
    elif current_vote == -1:
        dislikes_diff -= 1
        
    if new_vote == 1:
        likes_diff += 1
    elif new_vote == -1:
        dislikes_diff += 1
        
    if new_vote == 0:
        await execute(
            "DELETE FROM local_review_votes WHERE review_id = $1 AND user_id = $2",
            review_id, current_user["id"]
        )
    else:
        await execute(
            """
            INSERT INTO local_review_votes (review_id, user_id, vote)
            VALUES ($1, $2, $3)
            ON CONFLICT (review_id, user_id) DO UPDATE SET vote = EXCLUDED.vote
            """,
            review_id, current_user["id"], new_vote
        )
        
    await execute(
        "UPDATE local_reviews SET likes_count = likes_count + $1, dislikes_count = dislikes_count + $2 WHERE id = $3",
        likes_diff, dislikes_diff, review_id
    )

    return {"success": True}
