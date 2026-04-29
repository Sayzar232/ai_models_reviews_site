from fastapi import APIRouter, HTTPException, Query
from backend.database import fetch_one, fetch_all

router = APIRouter(prefix="/models", tags=["models"])


@router.get("")
async def get_models(
    sort: str = Query("rating", pattern="^(rating|reviews|name|date)$"),
    search: str = Query("", max_length=100),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    offset = (page - 1) * limit
    base_query = """
        SELECT m.id, m.name, m.slug, m.logo_url, m.description, m.website_url, m.created_at,
               COALESCE(s.avg_overall, 0) as avg_overall,
               COALESCE(s.avg_coding, 0) as avg_coding,
               COALESCE(s.avg_speed, 0) as avg_speed,
               COALESCE(s.avg_value, 0) as avg_value,
               COALESCE(s.avg_context, 0) as avg_context,
               COALESCE(s.avg_creativity, 0) as avg_creativity,
               COALESCE(s.avg_accuracy, 0) as avg_accuracy,
               COALESCE(s.review_count, 0) as review_count
        FROM ai_models m
        LEFT JOIN model_stats s ON m.id = s.model_id
    """

    if search:
        base_query += " WHERE LOWER(m.name) LIKE LOWER($1)"
        search_param = f"%{search}%"
    else:
        search_param = None

    order_map = {
        "rating": "avg_overall DESC",
        "reviews": "review_count DESC",
        "name": "m.name ASC",
        "date": "m.created_at DESC",
    }
    base_query += f" ORDER BY {order_map[sort]}, m.id ASC LIMIT ${2 if search else 1} OFFSET ${3 if search else 2}"

    if search_param:
        rows = await fetch_all(base_query, search_param, limit, offset)
    else:
        rows = await fetch_all(base_query, limit, offset)

    return [
        {
            "id": r["id"],
            "name": r["name"],
            "slug": r["slug"],
            "logo_url": r["logo_url"] or "",
            "description": r["description"] or "",
            "website_url": r["website_url"] or "",
            "created_at": r["created_at"].isoformat(),
            "stats": {
                "avg_overall": round(float(r["avg_overall"]), 2),
                "avg_coding": round(float(r["avg_coding"]), 2),
                "avg_speed": round(float(r["avg_speed"]), 2),
                "avg_value": round(float(r["avg_value"]), 2),
                "avg_context": round(float(r["avg_context"]), 2),
                "avg_creativity": round(float(r["avg_creativity"]), 2),
                "avg_accuracy": round(float(r["avg_accuracy"]), 2),
                "review_count": r["review_count"],
            },
        }
        for r in rows
    ]


@router.get("/{model_id}")
async def get_model(model_id: int):
    row = await fetch_one(
        """
        SELECT m.id, m.name, m.slug, m.logo_url, m.description, m.website_url, m.created_at,
               COALESCE(s.avg_overall, 0) as avg_overall,
               COALESCE(s.avg_coding, 0) as avg_coding,
               COALESCE(s.avg_speed, 0) as avg_speed,
               COALESCE(s.avg_value, 0) as avg_value,
               COALESCE(s.avg_context, 0) as avg_context,
               COALESCE(s.avg_creativity, 0) as avg_creativity,
               COALESCE(s.avg_accuracy, 0) as avg_accuracy,
               COALESCE(s.review_count, 0) as review_count
        FROM ai_models m
        LEFT JOIN model_stats s ON m.id = s.model_id
        WHERE m.id = $1
        """,
        model_id,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Модель не найдена")

    return {
        "id": row["id"],
        "name": row["name"],
        "slug": row["slug"],
        "logo_url": row["logo_url"] or "",
        "description": row["description"] or "",
        "website_url": row["website_url"] or "",
        "created_at": row["created_at"].isoformat(),
        "stats": {
            "avg_overall": round(float(row["avg_overall"]), 2),
            "avg_coding": round(float(row["avg_coding"]), 2),
            "avg_speed": round(float(row["avg_speed"]), 2),
            "avg_value": round(float(row["avg_value"]), 2),
            "avg_context": round(float(row["avg_context"]), 2),
            "avg_creativity": round(float(row["avg_creativity"]), 2),
            "avg_accuracy": round(float(row["avg_accuracy"]), 2),
            "review_count": row["review_count"],
        },
    }
