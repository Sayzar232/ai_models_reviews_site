-- =====================================================
-- Migration: rename criteria columns
-- Cloud models: price→value, availability→context
-- Local models: vram→reasoning, creativity→instruction
-- =====================================================

-- CLOUD MODELS: reviews table
ALTER TABLE reviews
    RENAME COLUMN score_price TO score_value;

ALTER TABLE reviews
    RENAME COLUMN score_availability TO score_context;

-- CLOUD MODELS: model_stats table
ALTER TABLE model_stats
    RENAME COLUMN avg_price TO avg_value;

ALTER TABLE model_stats
    RENAME COLUMN avg_availability TO avg_context;

-- LOCAL MODELS: local_reviews table
ALTER TABLE local_reviews
    RENAME COLUMN score_vram TO score_reasoning;

ALTER TABLE local_reviews
    RENAME COLUMN score_creativity TO score_instruction;

-- LOCAL MODELS: local_model_stats table
ALTER TABLE local_model_stats
    RENAME COLUMN avg_vram TO avg_reasoning;

ALTER TABLE local_model_stats
    RENAME COLUMN avg_creativity TO avg_instruction;
