-- AI Review Hub — Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'обычный пользователь',
    bio TEXT DEFAULT '',
    avatar_url VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Models table
CREATE TABLE IF NOT EXISTS ai_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url VARCHAR(500) DEFAULT '',
    description TEXT DEFAULT '',
    website_url VARCHAR(500) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id INTEGER NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    overall_score NUMERIC(3,1) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 10),
    score_coding NUMERIC(3,1) NOT NULL CHECK (score_coding >= 0 AND score_coding <= 10),
    score_speed NUMERIC(3,1) NOT NULL CHECK (score_speed >= 0 AND score_speed <= 10),
    score_price NUMERIC(3,1) NOT NULL CHECK (score_price >= 0 AND score_price <= 10),
    score_availability NUMERIC(3,1) NOT NULL CHECK (score_availability >= 0 AND score_availability <= 10),
    score_creativity NUMERIC(3,1) NOT NULL CHECK (score_creativity >= 0 AND score_creativity <= 10),
    score_accuracy NUMERIC(3,1) NOT NULL CHECK (score_accuracy >= 0 AND score_accuracy <= 10),
    text TEXT NOT NULL CHECK (char_length(text) >= 50),
    tags JSONB DEFAULT '[]'::jsonb,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, model_id)
);

-- Review votes table
CREATE TABLE IF NOT EXISTS review_votes (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Model stats cache table
CREATE TABLE IF NOT EXISTS model_stats (
    model_id INTEGER PRIMARY KEY REFERENCES ai_models(id) ON DELETE CASCADE,
    avg_overall NUMERIC(4,2) DEFAULT 0,
    avg_coding NUMERIC(4,2) DEFAULT 0,
    avg_speed NUMERIC(4,2) DEFAULT 0,
    avg_price NUMERIC(4,2) DEFAULT 0,
    avg_availability NUMERIC(4,2) DEFAULT 0,
    avg_creativity NUMERIC(4,2) DEFAULT 0,
    avg_accuracy NUMERIC(4,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_model_id ON reviews(model_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_models_slug ON ai_models(slug);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes(user_id);

-- LOCAL MODELS SCHEMA (HuggingFace)

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

CREATE TABLE IF NOT EXISTS local_review_votes (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES local_reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

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

CREATE INDEX IF NOT EXISTS idx_local_reviews_model_id ON local_reviews(model_id);
CREATE INDEX IF NOT EXISTS idx_local_reviews_user_id ON local_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_local_reviews_created_at ON local_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_local_models_slug ON local_models(slug);
CREATE INDEX IF NOT EXISTS idx_local_review_votes_review_id ON local_review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_local_review_votes_user_id ON local_review_votes(user_id);
