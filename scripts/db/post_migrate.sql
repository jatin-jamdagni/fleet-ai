-- ============================================================
-- Post-migration: Add PostGIS + pgvector columns
-- Run ONCE after: bunx prisma migrate dev
-- ============================================================

-- Add PostGIS geometry column to gps_pings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gps_pings' AND column_name = 'location'
  ) THEN
    ALTER TABLE gps_pings
      ADD COLUMN location geometry(Point, 4326);

    -- Spatial index for fast geospatial queries
    CREATE INDEX idx_gps_pings_location
      ON gps_pings USING GIST(location);

    RAISE NOTICE 'Added PostGIS location column to gps_pings';
  ELSE
    RAISE NOTICE 'PostGIS location column already exists';
  END IF;
END $$;

-- Add PostGIS geometry column to trips (route)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'route_geometry'
  ) THEN
    ALTER TABLE trips
      ADD COLUMN route_geometry geometry(LineString, 4326);

    CREATE INDEX idx_trips_route_geometry
      ON trips USING GIST(route_geometry);

    RAISE NOTICE 'Added PostGIS route_geometry column to trips';
  ELSE
    RAISE NOTICE 'PostGIS route_geometry column already exists';
  END IF;
END $$;

-- Add pgvector embedding column to manual_chunks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'manual_chunks' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE manual_chunks
      ADD COLUMN embedding vector(768);

    -- IVFFlat index for fast similarity search
    CREATE INDEX idx_manual_chunks_embedding
      ON manual_chunks USING ivfflat(embedding vector_cosine_ops)
      WITH (lists = 100);

    RAISE NOTICE 'Added pgvector embedding column to manual_chunks';
  ELSE
    RAISE NOTICE 'pgvector embedding column already exists';
  END IF;
END $$;

-- Trigger: auto-populate location geometry from lat/lng on gps_pings insert
CREATE OR REPLACE FUNCTION sync_gps_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_gps_location ON gps_pings;
CREATE TRIGGER trg_sync_gps_location
  BEFORE INSERT OR UPDATE ON gps_pings
  FOR EACH ROW EXECUTE FUNCTION sync_gps_location();

DO $$
BEGIN
  RAISE NOTICE 'GPS location sync trigger created';
  RAISE NOTICE 'Post-migration complete - PostGIS + pgvector ready!';
END $$;
