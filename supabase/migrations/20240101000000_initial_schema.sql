-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tracks table  
CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    total_steps INTEGER NOT NULL,
    badge_emoji TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guest sessions table
CREATE TABLE IF NOT EXISTS guest_sessions (
    id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES properties(id),
    guest_hash TEXT NOT NULL,
    track_id TEXT REFERENCES tracks(id),
    points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create track steps table
CREATE TABLE IF NOT EXISTS track_steps (
    id TEXT PRIMARY KEY,
    track_id TEXT REFERENCES tracks(id),
    order_idx INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    quest_type TEXT CHECK (quest_type IN ('photo', 'text')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES guest_sessions(id),
    step_id TEXT REFERENCES track_steps(id),
    proof_url TEXT,
    text_content TEXT,
    approved_bool BOOLEAN DEFAULT FALSE,
    points_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create knowledge base table
CREATE TABLE IF NOT EXISTS kb_docs (
    id TEXT PRIMARY KEY,
    property_id TEXT REFERENCES properties(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data for development
INSERT INTO properties (id, name) VALUES 
    ('property-123', 'Cozy Downtown Loft')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tracks (id, name, description, total_steps, badge_emoji) VALUES 
    ('track-123', 'Welcome Quest', 'Complete your welcome journey and earn your first badge!', 3, '🌟')
ON CONFLICT (id) DO NOTHING;

INSERT INTO guest_sessions (id, property_id, guest_hash, track_id, points, status) VALUES 
    ('session-123', 'property-123', 'guest-hash-123', 'track-123', 50, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO track_steps (id, track_id, order_idx, prompt, quest_type) VALUES 
    ('step-1', 'track-123', 0, 'Welcome! Let''s start your adventure. Take a selfie with your favorite spot in the property! 📸', 'photo'),
    ('step-2', 'track-123', 1, 'Tell us what you love most about this space so far! Share your first impressions. ✨', 'text'),
    ('step-3', 'track-123', 2, 'One more photo! Show us your setup - how you''ve made this space your own! 🏠', 'photo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO submissions (id, session_id, step_id, proof_url, approved_bool, points_awarded) VALUES 
    ('submission-1', 'session-123', 'step-1', '/mock-image.jpg', TRUE, 50)
ON CONFLICT (id) DO NOTHING;

INSERT INTO kb_docs (id, property_id, question, answer) VALUES 
    ('kb-1', 'property-123', 'What is the WiFi password?', 'The WiFi password is "WelcomeHome2024". You can find it on the card next to the router in the living room.'),
    ('kb-2', 'property-123', 'How do I check out?', 'Check out is at 11 AM. Please leave the keys in the lockbox and ensure all windows and doors are closed. Thank you for staying with us!'),
    ('kb-3', 'property-123', 'Where can I park?', 'Free street parking is available directly in front of the building. There is also a paid parking garage two blocks away if you prefer covered parking.')
ON CONFLICT (id) DO NOTHING;

-- Add some indexes for performance
CREATE INDEX IF NOT EXISTS idx_guest_sessions_property_id ON guest_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_track_steps_track_id ON track_steps(track_id);
CREATE INDEX IF NOT EXISTS idx_submissions_session_id ON submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_kb_docs_property_id ON kb_docs(property_id);


