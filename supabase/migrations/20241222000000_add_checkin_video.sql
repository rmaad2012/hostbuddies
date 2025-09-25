-- Add checkin video URL column to properties table
-- This allows hosts to upload video tutorials for property check-in

ALTER TABLE properties ADD COLUMN IF NOT EXISTS checkin_video_url TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN properties.checkin_video_url IS 'URL to video tutorial showing guests how to check into the property';
