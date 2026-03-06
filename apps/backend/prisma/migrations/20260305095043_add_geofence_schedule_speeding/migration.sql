DO $$
BEGIN
  CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'NOTIFIED', 'STARTED', 'COMPLETED', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "vehicles"
  ADD COLUMN IF NOT EXISTS "speedLimitKmh" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "geofences" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT NOT NULL DEFAULT '#f59e0b',
  "polygon" geometry(Polygon,4326) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "alertOnEnter" BOOLEAN NOT NULL DEFAULT true,
  "alertOnExit" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "geofences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "geofence_events" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "geofenceId" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "driverId" TEXT,
  "eventType" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "geofence_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "scheduled_trips" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "driverId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "reminderSentAt" TIMESTAMP(3),
  "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDING',
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "scheduled_trips_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "speeding_events" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "tripId" TEXT NOT NULL,
  "vehicleId" TEXT NOT NULL,
  "driverId" TEXT,
  "speedKmh" DOUBLE PRECISION NOT NULL,
  "limitKmh" DOUBLE PRECISION NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "speeding_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "geofences_tenantId_idx" ON "geofences"("tenantId");
CREATE INDEX IF NOT EXISTS "geofence_events_tenantId_occurredAt_idx" ON "geofence_events"("tenantId", "occurredAt");
CREATE INDEX IF NOT EXISTS "geofence_events_geofenceId_idx" ON "geofence_events"("geofenceId");
CREATE INDEX IF NOT EXISTS "scheduled_trips_tenantId_scheduledAt_idx" ON "scheduled_trips"("tenantId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "scheduled_trips_driverId_scheduledAt_idx" ON "scheduled_trips"("driverId", "scheduledAt");
CREATE INDEX IF NOT EXISTS "speeding_events_tenantId_occurredAt_idx" ON "speeding_events"("tenantId", "occurredAt");
CREATE INDEX IF NOT EXISTS "speeding_events_tripId_idx" ON "speeding_events"("tripId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'geofences_tenantId_fkey') THEN
    ALTER TABLE "geofences"
      ADD CONSTRAINT "geofences_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'geofence_events_geofenceId_fkey') THEN
    ALTER TABLE "geofence_events"
      ADD CONSTRAINT "geofence_events_geofenceId_fkey"
      FOREIGN KEY ("geofenceId") REFERENCES "geofences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'geofence_events_tripId_fkey') THEN
    ALTER TABLE "geofence_events"
      ADD CONSTRAINT "geofence_events_tripId_fkey"
      FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'geofence_events_vehicleId_fkey') THEN
    ALTER TABLE "geofence_events"
      ADD CONSTRAINT "geofence_events_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_trips_tenantId_fkey') THEN
    ALTER TABLE "scheduled_trips"
      ADD CONSTRAINT "scheduled_trips_tenantId_fkey"
      FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_trips_vehicleId_fkey') THEN
    ALTER TABLE "scheduled_trips"
      ADD CONSTRAINT "scheduled_trips_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_trips_driverId_fkey') THEN
    ALTER TABLE "scheduled_trips"
      ADD CONSTRAINT "scheduled_trips_driverId_fkey"
      FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'scheduled_trips_createdById_fkey') THEN
    ALTER TABLE "scheduled_trips"
      ADD CONSTRAINT "scheduled_trips_createdById_fkey"
      FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'speeding_events_tripId_fkey') THEN
    ALTER TABLE "speeding_events"
      ADD CONSTRAINT "speeding_events_tripId_fkey"
      FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'speeding_events_vehicleId_fkey') THEN
    ALTER TABLE "speeding_events"
      ADD CONSTRAINT "speeding_events_vehicleId_fkey"
      FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
