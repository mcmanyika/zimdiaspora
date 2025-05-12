-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS user_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS availability VARCHAR(50) CHECK (availability IN ('full-time', 'part-time', 'contract', 'freelance', 'not-available'));

-- Add default values for existing rows
UPDATE profiles
SET 
    user_level = 1,
    availability = 'not-available'
WHERE user_level IS NULL OR availability IS NULL; 