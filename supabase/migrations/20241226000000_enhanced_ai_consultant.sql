-- Enhanced AI Consultant Features Migration
-- Adds knowledge base, web scraping, and enhanced memory capabilities

-- Update memory types to include new categories
ALTER TABLE ai_consultant_memory DROP CONSTRAINT IF EXISTS ai_consultant_memory_memory_type_check;
ALTER TABLE ai_consultant_memory ADD CONSTRAINT ai_consultant_memory_memory_type_check 
CHECK (memory_type IN (
    'listing_history', 'pricing_data', 'optimization_suggestions', 'user_preferences', 
    'market_insights', 'conversation_history', 'listing_audit', 'knowledge_base_document', 
    'web_scraped_listing', 'competitor_analysis', 'seasonal_insights'
));

-- Knowledge Base Documents Table
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES ai_consultant_sessions(id) ON DELETE CASCADE,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('pdf', 'text', 'url', 'markdown')),
    file_path TEXT, -- For uploaded files
    content_text TEXT, -- Extracted text content
    content_summary TEXT, -- AI-generated summary
    metadata JSONB DEFAULT '{}', -- File size, page count, etc.
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    embedding_vector vector(1536), -- For semantic search (if using embeddings)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Web Scraped Listings Table
CREATE TABLE IF NOT EXISTS web_scraped_listings (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES ai_consultant_sessions(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    listing_title TEXT,
    listing_description TEXT,
    price_data JSONB,
    amenities JSONB,
    photos_data JSONB,
    reviews_summary JSONB,
    location_data JSONB,
    scraping_status TEXT DEFAULT 'pending' CHECK (scraping_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Listing Analysis Table
CREATE TABLE IF NOT EXISTS listing_analysis (
    id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    session_id TEXT REFERENCES ai_consultant_sessions(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('competitor_comparison', 'market_positioning', 'optimization_audit', 'seasonal_analysis')),
    analysis_data JSONB NOT NULL,
    recommendations JSONB,
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Chunks Table (for large document processing)
CREATE TABLE IF NOT EXISTS document_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT REFERENCES knowledge_base_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_summary TEXT,
    embedding_vector vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_user_id ON knowledge_base_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_session_id ON knowledge_base_documents(session_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_documents_status ON knowledge_base_documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_web_scraped_listings_user_id ON web_scraped_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_web_scraped_listings_session_id ON web_scraped_listings(session_id);
CREATE INDEX IF NOT EXISTS idx_web_scraped_listings_url ON web_scraped_listings(url);
CREATE INDEX IF NOT EXISTS idx_listing_analysis_property_id ON listing_analysis(property_id);
CREATE INDEX IF NOT EXISTS idx_listing_analysis_session_id ON listing_analysis(session_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);

-- RLS Policies
ALTER TABLE knowledge_base_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_scraped_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Knowledge Base Documents policies
CREATE POLICY "Users can view their own documents" ON knowledge_base_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own documents" ON knowledge_base_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON knowledge_base_documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON knowledge_base_documents
    FOR DELETE USING (auth.uid() = user_id);

-- Web Scraped Listings policies
CREATE POLICY "Users can view their own scraped listings" ON web_scraped_listings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scraped listings" ON web_scraped_listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraped listings" ON web_scraped_listings
    FOR UPDATE USING (auth.uid() = user_id);

-- Listing Analysis policies
CREATE POLICY "Users can view analysis for their properties" ON listing_analysis
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = listing_analysis.property_id 
        AND properties.user_id = auth.uid()
    ));

CREATE POLICY "Users can create analysis for their properties" ON listing_analysis
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = listing_analysis.property_id 
        AND properties.user_id = auth.uid()
    ));

-- Document Chunks policies
CREATE POLICY "Users can view chunks for their documents" ON document_chunks
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM knowledge_base_documents 
        WHERE knowledge_base_documents.id = document_chunks.document_id 
        AND knowledge_base_documents.user_id = auth.uid()
    ));

CREATE POLICY "Users can create chunks for their documents" ON document_chunks
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM knowledge_base_documents 
        WHERE knowledge_base_documents.id = document_chunks.document_id 
        AND knowledge_base_documents.user_id = auth.uid()
    ));

-- Update triggers for timestamps
CREATE TRIGGER update_knowledge_base_documents_updated_at BEFORE UPDATE ON knowledge_base_documents
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
