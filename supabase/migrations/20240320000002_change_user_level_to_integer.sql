-- Drop existing check constraint
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_user_level_check;

-- Change user_level column type to INTEGER
ALTER TABLE profiles
ALTER COLUMN user_level TYPE INTEGER USING CASE 
    WHEN user_level = '1' THEN 1
    WHEN user_level = '2' THEN 2
    WHEN user_level = '3' THEN 3
    ELSE 1
END;

-- Set default value to 1
ALTER TABLE profiles
ALTER COLUMN user_level SET DEFAULT 1;

-- Update any NULL values to 1
UPDATE profiles
SET user_level = 1
WHERE user_level IS NULL; 