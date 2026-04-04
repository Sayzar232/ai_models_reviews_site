import asyncpg
from backend.config import get_settings

pool: asyncpg.Pool | None = None


async def create_pool():
    global pool
    settings = get_settings()
    dsn = settings.DATABASE_URL
    pool = await asyncpg.create_pool(dsn=dsn, min_size=2, max_size=10)
    return pool


async def close_pool():
    global pool
    if pool:
        await pool.close()
        pool = None


def get_pool() -> asyncpg.Pool:
    if pool is None:
        raise RuntimeError("Database pool is not initialized")
    return pool


async def fetch_one(query: str, *args):
    p = get_pool()
    async with p.acquire() as conn:
        return await conn.fetchrow(query, *args)


async def fetch_all(query: str, *args):
    p = get_pool()
    async with p.acquire() as conn:
        return await conn.fetch(query, *args)


async def execute(query: str, *args):
    p = get_pool()
    async with p.acquire() as conn:
        return await conn.execute(query, *args)
