-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDING', 'NOTIFIED', 'STARTED', 'COMPLETED', 'CANCELED');

-- Enable PostGIS for geometry support
CREATE EXTENSION IF NOT EXISTS postgis;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "speedLimitKmh" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "geofences" (
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

-- CreateTable
CREATE TABLE "geofence_events" (
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

-- CreateTable
CREATE TABLE "scheduled_trips" (
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

-- CreateTable
CREATE TABLE "speeding_events" (
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

-- CreateIndex
CREATE INDEX "geofences_tenantId_idx" ON "geofences"("tenantId");

-- CreateIndex
CREATE INDEX "geofence_events_tenantId_occurredAt_idx" ON "geofence_events"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "geofence_events_geofenceId_idx" ON "geofence_events"("geofenceId");

-- CreateIndex
CREATE INDEX "scheduled_trips_tenantId_scheduledAt_idx" ON "scheduled_trips"("tenantId", "scheduledAt");

-- CreateIndex
CREATE INDEX "scheduled_trips_driverId_scheduledAt_idx" ON "scheduled_trips"("driverId", "scheduledAt");

-- CreateIndex
CREATE INDEX "speeding_events_tenantId_occurredAt_idx" ON "speeding_events"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "speeding_events_tripId_idx" ON "speeding_events"("tripId");

-- AddForeignKey
ALTER TABLE "geofences" ADD CONSTRAINT "geofences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_geofenceId_fkey" FOREIGN KEY ("geofenceId") REFERENCES "geofences"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geofence_events" ADD CONSTRAINT "geofence_events_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_trips" ADD CONSTRAINT "scheduled_trips_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_trips" ADD CONSTRAINT "scheduled_trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_trips" ADD CONSTRAINT "scheduled_trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_trips" ADD CONSTRAINT "scheduled_trips_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speeding_events" ADD CONSTRAINT "speeding_events_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "speeding_events" ADD CONSTRAINT "speeding_events_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
