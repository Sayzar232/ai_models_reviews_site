import asyncio
from backend.database import create_pool, close_pool, execute

async def run_local_migrations():
    pool = await create_pool()
    try:
        print("Creating local_models table...")
        await execute("""
        CREATE TABLE IF NOT EXISTS local_models (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) UNIQUE NOT NULL,
            author VARCHAR(100) DEFAULT '',
            logo_url VARCHAR(500) DEFAULT '',
            description TEXT DEFAULT '',
            website_url VARCHAR(500) DEFAULT '',
            parameters_approx NUMERIC(6,2) DEFAULT 0,
            downloads INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """)

        print("Creating local_reviews table...")
        await execute("""
        CREATE TABLE IF NOT EXISTS local_reviews (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            model_id INTEGER NOT NULL REFERENCES local_models(id) ON DELETE CASCADE,
            overall_score NUMERIC(3,1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
            score_coding NUMERIC(3,1) NOT NULL CHECK (score_coding >= 0 AND score_coding <= 10),
            score_speed NUMERIC(3,1) NOT NULL CHECK (score_speed >= 0 AND score_speed <= 10),
            score_vram NUMERIC(3,1) NOT NULL CHECK (score_vram >= 0 AND score_vram <= 10),
            score_context NUMERIC(3,1) NOT NULL CHECK (score_context >= 0 AND score_context <= 10),
            score_creativity NUMERIC(3,1) NOT NULL CHECK (score_creativity >= 0 AND score_creativity <= 10),
            score_accuracy NUMERIC(3,1) NOT NULL CHECK (score_accuracy >= 0 AND score_accuracy <= 10),
            text TEXT NOT NULL CHECK (char_length(text) >= 50),
            tags JSONB DEFAULT '[]'::jsonb,
            likes_count INTEGER DEFAULT 0,
            dislikes_count INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, model_id)
        );
        """)

        print("Creating local_review_votes table...")
        await execute("""
        CREATE TABLE IF NOT EXISTS local_review_votes (
            id SERIAL PRIMARY KEY,
            review_id INTEGER NOT NULL REFERENCES local_reviews(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(review_id, user_id)
        );
        """)

        print("Creating local_model_stats table...")
        await execute("""
        CREATE TABLE IF NOT EXISTS local_model_stats (
            model_id INTEGER PRIMARY KEY REFERENCES local_models(id) ON DELETE CASCADE,
            avg_overall NUMERIC(4,2) DEFAULT 0,
            avg_coding NUMERIC(4,2) DEFAULT 0,
            avg_speed NUMERIC(4,2) DEFAULT 0,
            avg_vram NUMERIC(4,2) DEFAULT 0,
            avg_context NUMERIC(4,2) DEFAULT 0,
            avg_creativity NUMERIC(4,2) DEFAULT 0,
            avg_accuracy NUMERIC(4,2) DEFAULT 0,
            review_count INTEGER DEFAULT 0,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """)
        
        print("Creating indexes...")
        await execute("CREATE INDEX IF NOT EXISTS idx_local_reviews_model_id ON local_reviews(model_id);")
        await execute("CREATE INDEX IF NOT EXISTS idx_local_reviews_user_id ON local_reviews(user_id);")
        await execute("CREATE INDEX IF NOT EXISTS idx_local_reviews_created_at ON local_reviews(created_at DESC);")
        await execute("CREATE INDEX IF NOT EXISTS idx_local_models_slug ON local_models(slug);")
        await execute("CREATE INDEX IF NOT EXISTS idx_local_review_votes_review_id ON local_review_votes(review_id);")
        await execute("CREATE INDEX IF NOT EXISTS idx_local_review_votes_user_id ON local_review_votes(user_id);")
        
        print("Local models migrations completed successfully.")
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        await close_pool()

if __name__ == "__main__":
    asyncio.run(run_local_migrations())
