from backend.database import execute, fetch_one


async def recalculate_model_stats(model_id: int):
    """Recalculate aggregated stats for a model after a review is added/updated."""
    stats = await fetch_one(
        """
        SELECT
            COALESCE(AVG(overall_score), 0) as avg_overall,
            COALESCE(AVG(score_coding), 0) as avg_coding,
            COALESCE(AVG(score_speed), 0) as avg_speed,
            COALESCE(AVG(score_value), 0) as avg_value,
            COALESCE(AVG(score_context), 0) as avg_context,
            COALESCE(AVG(score_creativity), 0) as avg_creativity,
            COALESCE(AVG(score_accuracy), 0) as avg_accuracy,
            COUNT(*) as review_count
        FROM reviews
        WHERE model_id = $1
        """,
        model_id,
    )

    await execute(
        """
        INSERT INTO model_stats (model_id, avg_overall, avg_coding, avg_speed, avg_value,
                                  avg_context, avg_creativity, avg_accuracy, review_count, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (model_id) DO UPDATE SET
            avg_overall = EXCLUDED.avg_overall,
            avg_coding = EXCLUDED.avg_coding,
            avg_speed = EXCLUDED.avg_speed,
            avg_value = EXCLUDED.avg_value,
            avg_context = EXCLUDED.avg_context,
            avg_creativity = EXCLUDED.avg_creativity,
            avg_accuracy = EXCLUDED.avg_accuracy,
            review_count = EXCLUDED.review_count,
            updated_at = NOW()
        """,
        model_id,
        float(stats["avg_overall"]),
        float(stats["avg_coding"]),
        float(stats["avg_speed"]),
        float(stats["avg_value"]),
        float(stats["avg_context"]),
        float(stats["avg_creativity"]),
        float(stats["avg_accuracy"]),
        int(stats["review_count"]),
    )

async def recalculate_local_model_stats(model_id: int):
    """Recalculate aggregated stats for a local model after a review is added/updated."""
    stats = await fetch_one(
        """
        SELECT
            COALESCE(AVG(overall_score), 0) as avg_overall,
            COALESCE(AVG(score_coding), 0) as avg_coding,
            COALESCE(AVG(score_speed), 0) as avg_speed,
            COALESCE(AVG(score_reasoning), 0) as avg_reasoning,
            COALESCE(AVG(score_context), 0) as avg_context,
            COALESCE(AVG(score_instruction), 0) as avg_instruction,
            COALESCE(AVG(score_accuracy), 0) as avg_accuracy,
            COUNT(*) as review_count
        FROM local_reviews
        WHERE model_id = $1
        """,
        model_id,
    )

    await execute(
        """
        INSERT INTO local_model_stats (model_id, avg_overall, avg_coding, avg_speed, avg_reasoning,
                                  avg_context, avg_instruction, avg_accuracy, review_count, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (model_id) DO UPDATE SET
            avg_overall = EXCLUDED.avg_overall,
            avg_coding = EXCLUDED.avg_coding,
            avg_speed = EXCLUDED.avg_speed,
            avg_reasoning = EXCLUDED.avg_reasoning,
            avg_context = EXCLUDED.avg_context,
            avg_instruction = EXCLUDED.avg_instruction,
            avg_accuracy = EXCLUDED.avg_accuracy,
            review_count = EXCLUDED.review_count,
            updated_at = NOW()
        """,
        model_id,
        float(stats["avg_overall"]),
        float(stats["avg_coding"]),
        float(stats["avg_speed"]),
        float(stats["avg_reasoning"]),
        float(stats["avg_context"]),
        float(stats["avg_instruction"]),
        float(stats["avg_accuracy"]),
        int(stats["review_count"]),
    )
