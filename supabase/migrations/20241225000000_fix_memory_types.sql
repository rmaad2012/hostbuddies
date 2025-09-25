-- Fix AI Consultant Memory Types
-- This migration updates the memory_type check constraint to include missing types

-- Drop the existing constraint
ALTER TABLE ai_consultant_memory DROP CONSTRAINT IF EXISTS ai_consultant_memory_memory_type_check;

-- Add the new constraint with all required memory types
ALTER TABLE ai_consultant_memory ADD CONSTRAINT ai_consultant_memory_memory_type_check 
CHECK (memory_type IN ('listing_history', 'pricing_data', 'optimization_suggestions', 'user_preferences', 'market_insights', 'conversation_history', 'listing_audit'));
