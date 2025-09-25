-- AI Consultant Features Migration
-- This adds comprehensive AI consultant capabilities for Airbnb optimization

-- AI Consultant Sessions Table
CREATE TABLE IF NOT EXISTS ai_consultant_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('listing_audit', 'pricing_analysis', 'title_optimization', 'seasonal_advice', 'guidebook_creation', 'general_consultation')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Consultant Memory Table (for persistent memory across sessions)
CREATE TABLE IF NOT EXISTS ai_consultant_memory (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES ai_consultant_sessions(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('listing_history', 'pricing_data', 'optimization_suggestions', 'user_preferences', 'market_insights', 'conversation_history', 'listing_audit')),
    content JSONB NOT NULL,
    importance_score INTEGER DEFAULT 1 CHECK (importance_score BETWEEN 1 AND 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Listing Versions Table (tracks listing iterations)
CREATE TABLE IF NOT EXISTS listing_versions (
    id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT,
    description TEXT,
    amenities JSONB,
    pricing_data JSONB,
    photos_data JSONB,
    optimization_notes TEXT,
    performance_metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market Data Cache Table (for Airbnb market data)
CREATE TABLE IF NOT EXISTS market_data_cache (
    id TEXT PRIMARY KEY,
    location TEXT NOT NULL,
    property_type TEXT,
    data_type TEXT NOT NULL CHECK (data_type IN ('pricing', 'competition', 'seasonal_trends', 'amenities_analysis')),
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Consultant Recommendations Table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES ai_consultant_sessions(id) ON DELETE CASCADE,
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('title_optimization', 'description_improvement', 'pricing_strategy', 'amenity_suggestion', 'photo_optimization', 'seasonal_adjustment')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    implementation_notes TEXT,
    expected_impact TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'implemented', 'dismissed', 'in_progress')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Web Search Cache Table (for internet search results)
CREATE TABLE IF NOT EXISTS web_search_cache (
    id TEXT PRIMARY KEY,
    query_hash TEXT NOT NULL,
    query TEXT NOT NULL,
    results JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add new columns to properties table for AI consultant features
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ai_consultant_enabled BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS current_listing_version INTEGER DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_ai_audit TIMESTAMP WITH TIME ZONE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ai_optimization_score INTEGER CHECK (ai_optimization_score BETWEEN 0 AND 100);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_consultant_sessions_user_id ON ai_consultant_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_consultant_sessions_property_id ON ai_consultant_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_consultant_memory_session_id ON ai_consultant_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_consultant_memory_type ON ai_consultant_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_listing_versions_property_id ON listing_versions(property_id);
CREATE INDEX IF NOT EXISTS idx_market_data_cache_location ON market_data_cache(location);
CREATE INDEX IF NOT EXISTS idx_market_data_cache_expires ON market_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_session_id ON ai_recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_web_search_cache_query_hash ON web_search_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_web_search_cache_expires ON web_search_cache(expires_at);

-- RLS Policies
ALTER TABLE ai_consultant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_consultant_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_search_cache ENABLE ROW LEVEL SECURITY;

-- AI Consultant Sessions policies
CREATE POLICY "Users can view their own consultant sessions" ON ai_consultant_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own consultant sessions" ON ai_consultant_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consultant sessions" ON ai_consultant_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- AI Consultant Memory policies
CREATE POLICY "Users can view memory for their sessions" ON ai_consultant_memory
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM ai_consultant_sessions 
        WHERE ai_consultant_sessions.id = ai_consultant_memory.session_id 
        AND ai_consultant_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can create memory for their sessions" ON ai_consultant_memory
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM ai_consultant_sessions 
        WHERE ai_consultant_sessions.id = ai_consultant_memory.session_id 
        AND ai_consultant_sessions.user_id = auth.uid()
    ));

-- Listing Versions policies
CREATE POLICY "Users can view their property versions" ON listing_versions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = listing_versions.property_id 
        AND properties.user_id = auth.uid()
    ));

CREATE POLICY "Users can create versions for their properties" ON listing_versions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = listing_versions.property_id 
        AND properties.user_id = auth.uid()
    ));

-- AI Recommendations policies
CREATE POLICY "Users can view recommendations for their sessions" ON ai_recommendations
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM ai_consultant_sessions 
        WHERE ai_consultant_sessions.id = ai_recommendations.session_id 
        AND ai_consultant_sessions.user_id = auth.uid()
    ));

CREATE POLICY "Users can create recommendations for their sessions" ON ai_recommendations
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM ai_consultant_sessions 
        WHERE ai_consultant_sessions.id = ai_recommendations.session_id 
        AND ai_consultant_sessions.user_id = auth.uid()
    ));

-- Market data and web search cache are read-only for users (populated by system)
CREATE POLICY "Users can view market data" ON market_data_cache
    FOR SELECT USING (true);

CREATE POLICY "Users can view web search cache" ON web_search_cache
    FOR SELECT USING (true);

-- Update triggers for timestamps
CREATE TRIGGER update_ai_consultant_sessions_updated_at BEFORE UPDATE ON ai_consultant_sessions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ai_consultant_memory_updated_at BEFORE UPDATE ON ai_consultant_memory
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_listing_versions_updated_at BEFORE UPDATE ON listing_versions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at BEFORE UPDATE ON ai_recommendations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
