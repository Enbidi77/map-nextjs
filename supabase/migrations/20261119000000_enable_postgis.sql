-- ==============================================================================
-- Migration: 20261119000000_enable_postgis.sql
-- Description: Enables required extensions for UUID generation, cryptographic
--              primitives, and PostGIS geospatial data types and indexing.
-- ==============================================================================

-- Enable UUID extension for UUIDv4 generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Enable pgcrypto for cryptographically secure random bytes and hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- Enable PostGIS geospatial extension
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA public;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
