-- Authentication Enhancements Migration
-- Adds host profile management and better auth tracking

-- Host profiles table
CREATE TABLE IF NOT EXISTS host_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    business_name TEXT,
    contact_phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    subscription_plan TEXT DEFAULT 'basic',
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auth sessions tracking
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT,
    ip_address TEXT,
    user_agent TEXT,
    login_method TEXT, -- email, google, github
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email verification tracking
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    verification_token TEXT UNIQUE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Host profiles policies
CREATE POLICY "Users can view their own profile" ON host_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON host_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON host_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Auth sessions policies
CREATE POLICY "Users can view their own sessions" ON auth_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert auth sessions" ON auth_sessions
    FOR INSERT WITH CHECK (true);

-- Password reset policies  
CREATE POLICY "Users can view their own reset tokens" ON password_reset_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert reset tokens" ON password_reset_tokens
    FOR INSERT WITH CHECK (true);

-- Email verification policies
CREATE POLICY "Users can view their own verifications" ON email_verifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert verifications" ON email_verifications
    FOR INSERT WITH CHECK (true);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_host_profiles_user_id ON host_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(verification_token);

-- Add triggers for updated_at
CREATE TRIGGER update_host_profiles_updated_at BEFORE UPDATE ON host_profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically create host profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.host_profiles (user_id, business_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Host')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW();
    
    DELETE FROM email_verifications 
    WHERE expires_at < NOW() AND verified = FALSE;
    
    DELETE FROM auth_sessions 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Insert sample host profile for existing user
INSERT INTO host_profiles (user_id, business_name, onboarding_completed)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', email, 'Host'),
    TRUE
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM host_profiles WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;
