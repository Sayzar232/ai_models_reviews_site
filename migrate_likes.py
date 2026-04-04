import asyncio
from backend.database import create_pool, close_pool, execute

async def run_migrations():
    pool = await create_pool()
    try:
        # 1. Add columns to reviews
        print("Adding likes_count and dislikes_count to reviews...")
        await execute("ALTER TABLE reviews ADD COLUMN likes_count INTEGER DEFAULT 0;")
        await execute("ALTER TABLE reviews ADD COLUMN dislikes_count INTEGER DEFAULT 0;")
    except Exception as e:
        print(f"Skipping columns adding (they might already exist): {e}")

    try:
        # 2. Add review_votes table
        print("Creating review_votes table...")
        await execute("""
        CREATE TABLE IF NOT EXISTS review_votes (
            id SERIAL PRIMARY KEY,
            review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(review_id, user_id)
        );
        """)
        
        await execute("CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);")
        await execute("CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes(user_id);")
        print("Migrations completed successfully.")
    except Exception as e:
        print(f"Error creating table: {e}")
    finally:
        await close_pool()

if __name__ == "__main__":
    asyncio.run(run_migrations())
