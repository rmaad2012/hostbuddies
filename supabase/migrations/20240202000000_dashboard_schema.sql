-- Dashboard Schema Migration
-- This extends the existing schema with dashboard-specific features

-- Enhanced properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS guidebook_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS guidebook_content TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS check_in_instructions TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_password TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS trash_day TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS quiet_hours TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS persona_style TEXT DEFAULT 'friendly_guide';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS qr_code_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Scavenger hunts table
CREATE TABLE IF NOT EXISTS scavenger_hunts (
    id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hunt clues table
CREATE TABLE IF NOT EXISTS hunt_clues (
    id TEXT PRIMARY KEY,
    hunt_id TEXT REFERENCES scavenger_hunts(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    clue_text TEXT NOT NULL,
    reference_image_url TEXT,
    location_hint TEXT,
    points_value INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memory packages table
CREATE TABLE IF NOT EXISTS memory_packages (
    id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_type TEXT DEFAULT 'standard',
    custom_content JSONB,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    notification_preferences JSONB DEFAULT '{}',
    theme_preference TEXT DEFAULT 'light',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend guest_sessions with more tracking
ALTER TABLE guest_sessions ADD COLUMN IF NOT EXISTS hunt_id TEXT REFERENCES scavenger_hunts(id);
ALTER TABLE guest_sessions ADD COLUMN IF NOT EXISTS memory_package_id TEXT REFERENCES memory_packages(id);
ALTER TABLE guest_sessions ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_scavenger_hunts_user_id ON scavenger_hunts(user_id);
CREATE INDEX IF NOT EXISTS idx_scavenger_hunts_property_id ON scavenger_hunts(property_id);
CREATE INDEX IF NOT EXISTS idx_hunt_clues_hunt_id ON hunt_clues(hunt_id);
CREATE INDEX IF NOT EXISTS idx_memory_packages_user_id ON memory_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_packages_property_id ON memory_packages(property_id);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_hunt_id ON guest_sessions(hunt_id);

-- RLS (Row Level Security) policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE scavenger_hunts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_clues ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Properties policies
CREATE POLICY "Users can view their own properties" ON properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- Scavenger hunts policies
CREATE POLICY "Users can view their own hunts" ON scavenger_hunts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hunts" ON scavenger_hunts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hunts" ON scavenger_hunts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hunts" ON scavenger_hunts
    FOR DELETE USING (auth.uid() = user_id);

-- Hunt clues policies (inherit from hunt ownership)
CREATE POLICY "Users can view clues for their hunts" ON hunt_clues
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM scavenger_hunts 
        WHERE scavenger_hunts.id = hunt_clues.hunt_id 
        AND scavenger_hunts.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert clues for their hunts" ON hunt_clues
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM scavenger_hunts 
        WHERE scavenger_hunts.id = hunt_clues.hunt_id 
        AND scavenger_hunts.user_id = auth.uid()
    ));

CREATE POLICY "Users can update clues for their hunts" ON hunt_clues
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM scavenger_hunts 
        WHERE scavenger_hunts.id = hunt_clues.hunt_id 
        AND scavenger_hunts.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete clues for their hunts" ON hunt_clues
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM scavenger_hunts 
        WHERE scavenger_hunts.id = hunt_clues.hunt_id 
        AND scavenger_hunts.user_id = auth.uid()
    ));

-- Memory packages policies
CREATE POLICY "Users can view their own memory packages" ON memory_packages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory packages" ON memory_packages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory packages" ON memory_packages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memory packages" ON memory_packages
    FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
    FOR UPDATE USING (auth.uid() = user_id);

-- Enable storage for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('guidebooks', 'guidebooks', false),
  ('hunt-images', 'hunt-images', true),
  ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload their own guidebooks" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'guidebooks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own guidebooks" ON storage.objects
    FOR SELECT USING (bucket_id = 'guidebooks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload hunt images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'hunt-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view hunt images" ON storage.objects
    FOR SELECT USING (bucket_id = 'hunt-images');

CREATE POLICY "Users can upload QR codes" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'qr-codes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view QR codes" ON storage.objects
    FOR SELECT USING (bucket_id = 'qr-codes');

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_scavenger_hunts_updated_at BEFORE UPDATE ON scavenger_hunts
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_hunt_clues_updated_at BEFORE UPDATE ON hunt_clues
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_memory_packages_updated_at BEFORE UPDATE ON memory_packages
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
