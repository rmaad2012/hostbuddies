-- Ensure storage buckets exist and have proper policies
-- This fixes the "Bucket not found" error

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('guidebooks', 'guidebooks', false, 10485760, ARRAY['application/pdf', 'text/plain', 'text/markdown']),
  ('hunt-images', 'hunt-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('qr-codes', 'qr-codes', true, 1048576, ARRAY['image/png', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure storage policies exist
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own guidebooks" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own guidebooks" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own guidebooks" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own guidebooks" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload hunt images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view hunt images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload QR codes" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view QR codes" ON storage.objects;

-- Recreate storage policies
CREATE POLICY "Users can upload their own guidebooks" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'guidebooks' 
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their own guidebooks" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'guidebooks' 
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own guidebooks" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'guidebooks' 
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own guidebooks" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'guidebooks' 
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can upload hunt images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'hunt-images' 
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Anyone can view hunt images" ON storage.objects
    FOR SELECT USING (bucket_id = 'hunt-images');

CREATE POLICY "Users can upload QR codes" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'qr-codes' 
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Anyone can view QR codes" ON storage.objects
    FOR SELECT USING (bucket_id = 'qr-codes');
