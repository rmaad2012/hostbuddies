-- Update AI Consultant Session Types
-- This migration updates the session_type check constraint to support market research mode

-- Drop the existing constraint
ALTER TABLE ai_consultant_sessions DROP CONSTRAINT IF EXISTS ai_consultant_sessions_session_type_check;

-- Add the new constraint with updated session types
ALTER TABLE ai_consultant_sessions ADD CONSTRAINT ai_consultant_sessions_session_type_check 
CHECK (session_type IN (
    'listing_audit', 
    'pricing_analysis', 
    'title_optimization', 
    'seasonal_advice', 
    'guidebook_creation', 
    'general_consultation',
    'market_research',
    'property_optimization'
));

-- Also update memory types to include new consultation session type
ALTER TABLE ai_consultant_memory DROP CONSTRAINT IF EXISTS ai_consultant_memory_memory_type_check;
ALTER TABLE ai_consultant_memory ADD CONSTRAINT ai_consultant_memory_memory_type_check 
CHECK (memory_type IN (
    'listing_history', 'pricing_data', 'optimization_suggestions', 'user_preferences', 
    'market_insights', 'conversation_history', 'listing_audit', 'knowledge_base_document', 
    'web_scraped_listing', 'competitor_analysis', 'seasonal_insights', 'consultation_session',
    'web_scraped_listing_audit'
));
