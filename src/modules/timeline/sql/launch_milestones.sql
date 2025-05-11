-- Create launch_milestones table
CREATE TABLE IF NOT EXISTS launch_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'in-progress', 'upcoming')),
    category TEXT NOT NULL CHECK (category IN ('development', 'testing', 'marketing', 'launch')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on date for faster sorting
CREATE INDEX IF NOT EXISTS idx_launch_milestones_date ON launch_milestones(date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_launch_milestones_updated_at
    BEFORE UPDATE ON launch_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO launch_milestones (title, description, date, status, category) VALUES
    ('Core Features Implementation', 'Implement essential platform features including user authentication and proposal management', NOW() - INTERVAL '30 days', 'completed', 'development'),
    ('Payment System Integration', 'Integrate Stripe payment system and test all payment flows', NOW() - INTERVAL '20 days', 'completed', 'development'),
    ('Security Testing', 'Conduct comprehensive security audit and penetration testing', NOW() - INTERVAL '10 days', 'in-progress', 'testing'),
    ('User Acceptance Testing', 'Perform UAT with selected group of users', NOW() - INTERVAL '5 days', 'upcoming', 'testing'),
    ('Marketing Website Launch', 'Launch marketing website and social media presence', NOW() + INTERVAL '5 days', 'upcoming', 'marketing'),
    ('Final Security Audit', 'Conduct final security review before launch', NOW() + INTERVAL '10 days', 'upcoming', 'launch'),
    ('Official Platform Launch', 'Launch the platform to the public', NOW() + INTERVAL '15 days', 'upcoming', 'launch'); 