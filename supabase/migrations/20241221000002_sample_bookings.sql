-- Sample Booking Data Migration
-- Adds sample bookings to demonstrate the booking management system

-- Insert sample bookings for the existing property
INSERT INTO bookings (
    id,
    property_id,
    external_booking_id,
    guest_name,
    guest_email,
    guest_phone,
    check_in_date,
    check_out_date,
    guest_count,
    booking_status,
    total_amount,
    currency,
    platform_name,
    booking_source,
    special_requests,
    auto_create_session
) VALUES 
    (
        gen_random_uuid(),
        'property-123',
        'HMABCD123456',
        'Sarah Johnson',
        'sarah.j@email.com',
        '+1-555-0123',
        '2024-01-15',
        '2024-01-18',
        2,
        'confirmed',
        450.00,
        'USD',
        'airbnb',
        'airbnb',
        'Celebrating anniversary - would love some local restaurant recommendations!',
        false
    ),
    (
        gen_random_uuid(),
        'property-123',
        'HMEFGH789012',
        'Michael Chen',
        'mchen.travel@gmail.com',
        '+1-555-0456',
        '2024-01-25',
        '2024-01-28',
        1,
        'confirmed',
        380.00,
        'USD',
        'airbnb',
        'airbnb',
        'Business trip - early check-in if possible',
        false
    ),
    (
        gen_random_uuid(),
        'property-123',
        'HMIJKL345678',
        'Emma Rodriguez',
        'emma.r.photography@outlook.com',
        '+1-555-0789',
        '2024-02-05',
        '2024-02-09',
        3,
        'pending',
        620.00,
        'USD',
        'airbnb',
        'airbnb',
        'Photography workshop group - quiet space needed for editing',
        false
    ),
    (
        gen_random_uuid(),
        'property-123',
        'HMMNOP901234',
        'David & Lisa Thompson',
        'thompson.family@yahoo.com',
        '+1-555-0321',
        '2024-02-14',
        '2024-02-17',
        2,
        'confirmed',
        495.00,
        'USD',
        'airbnb',
        'airbnb',
        'Valentine''s weekend getaway - romantic recommendations welcome!',
        false
    ),
    (
        gen_random_uuid(),
        'property-123',
        'HMQRST567890',
        'Alex Kim',
        'alexkim.dev@protonmail.com',
        '+1-555-0654',
        '2024-02-20',
        '2024-02-25',
        1,
        'cancelled',
        750.00,
        'USD',
        'airbnb',
        'airbnb',
        'Work retreat - need good WiFi for video calls',
        false
    )
ON CONFLICT (id) DO NOTHING;

-- Insert sample connected listing
INSERT INTO connected_listings (
    id,
    property_id,
    integration_id,
    external_listing_id,
    listing_title,
    listing_url,
    platform_name,
    sync_enabled,
    last_synced_at,
    sync_status
) VALUES (
    gen_random_uuid(),
    'property-123',
    (SELECT id FROM platform_integrations WHERE platform_name = 'airbnb' LIMIT 1),
    '52847392',
    'Cozy Downtown Loft - Perfect for City Explorers',
    'https://www.airbnb.com/rooms/52847392',
    'airbnb',
    true,
    NOW(),
    'active'
) ON CONFLICT (external_listing_id, platform_name) DO NOTHING;

-- Update platform integration status to connected
UPDATE platform_integrations 
SET 
    connection_status = 'connected',
    last_sync_at = NOW(),
    updated_at = NOW()
WHERE platform_name = 'airbnb';

-- Insert sample booking events for tracking (only if bookings exist)
DO $$
BEGIN
    INSERT INTO booking_events (
        booking_id,
        event_type,
        event_data,
        created_by,
        notes
    )
    SELECT 
        b.id,
        'booking_imported',
        jsonb_build_object('source', 'migration', 'platform', 'airbnb'),
        'system',
        'Sample booking data imported during migration'
    FROM bookings b
    WHERE b.external_booking_id LIKE 'HM%'
    AND EXISTS (SELECT 1 FROM bookings WHERE id = b.id);
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors, this is just sample data
    NULL;
END $$;
