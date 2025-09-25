-- Booking Management System Migration
-- Enables hosts to connect and manage their Airbnb listings and bookings

-- Platform integrations table (Airbnb, VRBO, Booking.com, etc.)
CREATE TABLE IF NOT EXISTS platform_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    platform_name TEXT NOT NULL, -- 'airbnb', 'vrbo', 'booking_com', 'manual'
    integration_type TEXT NOT NULL, -- 'api', 'manual', 'webhook', 'calendar_sync'
    api_credentials JSONB, -- Encrypted API keys/tokens
    connection_status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error'
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_frequency INTEGER DEFAULT 3600, -- seconds between syncs
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connected listings from external platforms
CREATE TABLE IF NOT EXISTS connected_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    integration_id UUID REFERENCES platform_integrations(id) ON DELETE CASCADE,
    external_listing_id TEXT NOT NULL, -- Airbnb listing ID
    listing_title TEXT,
    listing_url TEXT,
    platform_name TEXT NOT NULL,
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'active', -- 'active', 'paused', 'error'
    metadata JSONB DEFAULT '{}', -- Platform-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(external_listing_id, platform_name)
);

-- Bookings from connected platforms
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    connected_listing_id UUID REFERENCES connected_listings(id) ON DELETE SET NULL,
    external_booking_id TEXT, -- Airbnb reservation ID
    guest_name TEXT NOT NULL,
    guest_email TEXT,
    guest_phone TEXT,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guest_count INTEGER DEFAULT 1,
    booking_status TEXT DEFAULT 'confirmed', -- 'pending', 'confirmed', 'cancelled', 'completed'
    total_amount DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    platform_name TEXT NOT NULL,
    booking_source TEXT, -- 'airbnb', 'vrbo', 'manual', etc.
    special_requests TEXT,
    host_notes TEXT,
    guest_session_id TEXT REFERENCES guest_sessions(id),
    auto_create_session BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}', -- Platform-specific booking data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking events/timeline
CREATE TABLE IF NOT EXISTS booking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'created', 'modified', 'cancelled', 'check_in', 'check_out'
    event_data JSONB DEFAULT '{}',
    created_by TEXT, -- 'system', 'host', 'guest', 'platform'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar availability sync
CREATE TABLE IF NOT EXISTS calendar_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    available BOOLEAN DEFAULT TRUE,
    price DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',
    minimum_stay INTEGER DEFAULT 1,
    maximum_stay INTEGER,
    notes TEXT,
    source TEXT DEFAULT 'manual', -- 'manual', 'airbnb', 'vrbo', 'system'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, date)
);

-- Sync logs for debugging
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID REFERENCES platform_integrations(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL, -- 'bookings', 'calendar', 'listings'
    status TEXT NOT NULL, -- 'success', 'error', 'partial'
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    sync_data JSONB DEFAULT '{}',
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Platform integrations
CREATE POLICY "Users can manage their own integrations" ON platform_integrations
    FOR ALL USING (auth.uid() = user_id);

-- Connected listings  
CREATE POLICY "Users can manage their own connected listings" ON connected_listings
    FOR ALL USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = connected_listings.property_id 
        AND properties.user_id = auth.uid()
    ));

-- Bookings
CREATE POLICY "Users can manage bookings for their properties" ON bookings
    FOR ALL USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = bookings.property_id 
        AND properties.user_id = auth.uid()
    ));

-- Booking events
CREATE POLICY "Users can view events for their bookings" ON booking_events
    FOR ALL USING (EXISTS (
        SELECT 1 FROM bookings 
        JOIN properties ON properties.id = bookings.property_id
        WHERE bookings.id = booking_events.booking_id 
        AND properties.user_id = auth.uid()
    ));

-- Calendar availability
CREATE POLICY "Users can manage availability for their properties" ON calendar_availability
    FOR ALL USING (EXISTS (
        SELECT 1 FROM properties 
        WHERE properties.id = calendar_availability.property_id 
        AND properties.user_id = auth.uid()
    ));

-- Sync logs
CREATE POLICY "Users can view their own sync logs" ON sync_logs
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM platform_integrations 
        WHERE platform_integrations.id = sync_logs.integration_id 
        AND platform_integrations.user_id = auth.uid()
    ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_integrations_user_id ON platform_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_listings_property_id ON connected_listings(property_id);
CREATE INDEX IF NOT EXISTS idx_connected_listings_external_id ON connected_listings(external_listing_id, platform_name);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_external_id ON bookings(external_booking_id, platform_name);
CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON booking_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_calendar_availability_property_date ON calendar_availability(property_id, date);
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration_id ON sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at);

-- Triggers for updated_at
CREATE TRIGGER update_platform_integrations_updated_at BEFORE UPDATE ON platform_integrations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_connected_listings_updated_at BEFORE UPDATE ON connected_listings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_calendar_availability_updated_at BEFORE UPDATE ON calendar_availability
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to automatically create guest session for new bookings
CREATE OR REPLACE FUNCTION create_guest_session_for_booking()
RETURNS TRIGGER AS $$
DECLARE
    default_track_id TEXT;
    session_id TEXT;
BEGIN
    -- Only create session for confirmed bookings if auto_create_session is true
    IF NEW.booking_status = 'confirmed' AND NEW.auto_create_session = TRUE THEN
        -- Get default track for the property (or create a default one)
        SELECT t.id INTO default_track_id
        FROM tracks t
        WHERE EXISTS (
            SELECT 1 FROM properties p 
            WHERE p.id = NEW.property_id 
            AND p.user_id = auth.uid()
        )
        LIMIT 1;
        
        -- If no track exists, we'll use a default track ID
        IF default_track_id IS NULL THEN
            default_track_id := 'track-123'; -- Default welcome track
        END IF;
        
        -- Generate unique session ID
        session_id := 'session-' || NEW.id;
        
        -- Create guest session
        INSERT INTO guest_sessions (
            id,
            property_id,
            guest_hash,
            track_id,
            points,
            status
        ) VALUES (
            session_id,
            NEW.property_id,
            'guest-' || NEW.id,
            default_track_id,
            0,
            'active'
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Update booking with session ID
        NEW.guest_session_id := session_id;
        
        -- Log the event
        INSERT INTO booking_events (
            booking_id,
            event_type,
            event_data,
            created_by,
            notes
        ) VALUES (
            NEW.id,
            'session_created',
            jsonb_build_object('session_id', session_id),
            'system',
            'Automatically created guest session'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create guest session when booking is confirmed
CREATE TRIGGER create_guest_session_on_booking
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE PROCEDURE create_guest_session_for_booking();

-- Function to sync calendar availability
CREATE OR REPLACE FUNCTION sync_calendar_from_booking()
RETURNS TRIGGER AS $$
DECLARE
    booking_date DATE;
BEGIN
    -- When booking is confirmed, mark dates as unavailable
    IF NEW.booking_status = 'confirmed' THEN
        booking_date := NEW.check_in_date;
        
        -- Mark each date in the booking range as unavailable
        WHILE booking_date < NEW.check_out_date LOOP
            INSERT INTO calendar_availability (
                property_id,
                date,
                available,
                source
            ) VALUES (
                NEW.property_id,
                booking_date,
                FALSE,
                'booking'
            ) ON CONFLICT (property_id, date) 
            DO UPDATE SET 
                available = FALSE,
                source = 'booking',
                updated_at = NOW();
                
            booking_date := booking_date + INTERVAL '1 day';
        END LOOP;
    END IF;
    
    -- When booking is cancelled, mark dates as available again
    IF OLD.booking_status = 'confirmed' AND NEW.booking_status = 'cancelled' THEN
        UPDATE calendar_availability 
        SET available = TRUE, source = 'system', updated_at = NOW()
        WHERE property_id = NEW.property_id 
        AND date >= NEW.check_in_date 
        AND date < NEW.check_out_date
        AND source = 'booking';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync calendar when bookings change
CREATE TRIGGER sync_calendar_on_booking_change
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE PROCEDURE sync_calendar_from_booking();

-- Insert sample data
INSERT INTO platform_integrations (user_id, platform_name, integration_type, connection_status)
SELECT 
    id,
    'airbnb',
    'manual',
    'disconnected'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM platform_integrations WHERE platform_name = 'airbnb')
ON CONFLICT DO NOTHING;
