-- Initialize the test database
-- This script runs when the test PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom functions
CREATE OR REPLACE FUNCTION gen_random_uuid()
RETURNS uuid
AS $$
BEGIN
    RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- Set timezone
SET timezone = 'UTC';

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Test Database initialized successfully';
END $$; 