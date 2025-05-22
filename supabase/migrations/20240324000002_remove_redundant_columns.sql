-- Drop the redundant columns
ALTER TABLE investments DROP COLUMN status;
ALTER TABLE investments DROP COLUMN updated_at;
ALTER TABLE investments DROP COLUMN created_at; 