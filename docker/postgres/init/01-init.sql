-- Initial database setup for Flowtie
-- This script runs when PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- The database and user are already created by the PostgreSQL image
-- using POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE flowtie TO flowtie;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Flowtie database initialized successfully';
END $$;