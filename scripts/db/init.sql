-- ============================================================
-- Fleet AI SaaS — Database Initialization
-- Runs automatically when PostgreSQL container first starts
-- ============================================================

-- Enable PostGIS (includes PostGIS topology)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Enable pgvector for AI embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable uuid-ossp for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extensions loaded
DO $$
BEGIN
  RAISE NOTICE '✅ PostGIS version: %', PostGIS_Version();
  RAISE NOTICE '✅ pgvector loaded successfully';
  RAISE NOTICE '✅ Fleet AI database initialized';
END $$;

