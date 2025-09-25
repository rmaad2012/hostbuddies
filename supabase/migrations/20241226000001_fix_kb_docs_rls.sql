-- Fix kb_docs table RLS policies
-- The kb_docs table was missing RLS policies causing the security violation

-- Enable RLS for kb_docs table
ALTER TABLE kb_docs ENABLE ROW LEVEL SECURITY;

-- Add user_id column to kb_docs if it doesn't exist
ALTER TABLE kb_docs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing kb_docs to have user_id based on property ownership
UPDATE kb_docs 
SET user_id = properties.user_id 
FROM properties 
WHERE kb_docs.property_id = properties.id 
AND kb_docs.user_id IS NULL;

-- Create RLS policies for kb_docs
CREATE POLICY "Users can view kb_docs for their properties" ON kb_docs
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = kb_docs.property_id 
        AND properties.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert kb_docs for their properties" ON kb_docs
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = kb_docs.property_id 
        AND properties.user_id = auth.uid()
    ));

CREATE POLICY "Users can update kb_docs for their properties" ON kb_docs
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = kb_docs.property_id 
        AND properties.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete kb_docs for their properties" ON kb_docs
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = kb_docs.property_id 
        AND properties.user_id = auth.uid()
    ));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_kb_docs_property_id ON kb_docs(property_id);
CREATE INDEX IF NOT EXISTS idx_kb_docs_user_id ON kb_docs(user_id);
