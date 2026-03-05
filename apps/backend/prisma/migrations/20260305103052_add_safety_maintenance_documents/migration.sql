-- AlterTable
ALTER TABLE "users" ADD COLUMN     "licenceExpiry" TIMESTAMP(3),
ADD COLUMN     "licenceNumber" TEXT;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "maintenanceDueKm" DOUBLE PRECISION,
ADD COLUMN     "maintenanceEveryKm" DOUBLE PRECISION,
ADD COLUMN     "odometerKm" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "driver_scores" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totalTrips" INTEGER NOT NULL DEFAULT 0,
    "totalDistanceKm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgSpeedKmh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxSpeedKmh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "speedingEvents" INTEGER NOT NULL DEFAULT 0,
    "hoursOnRoad" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "scoreBreakdown" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hos_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "tripId" TEXT,
    "date" DATE NOT NULL,
    "drivingMin" INTEGER NOT NULL DEFAULT 0,
    "onDutyMin" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hos_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "odometer" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION,
    "performedAt" TIMESTAMP(3) NOT NULL,
    "nextDueKm" DOUBLE PRECISION,
    "nextDueDateAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DocumentToVehicle" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentToVehicle_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DocumentToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DocumentToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "driver_scores_tenantId_driverId_idx" ON "driver_scores"("tenantId", "driverId");

-- CreateIndex
CREATE INDEX "driver_scores_tenantId_date_idx" ON "driver_scores"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "driver_scores_tenantId_driverId_date_key" ON "driver_scores"("tenantId", "driverId", "date");

-- CreateIndex
CREATE INDEX "hos_logs_tenantId_driverId_date_idx" ON "hos_logs"("tenantId", "driverId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "hos_logs_tenantId_driverId_date_key" ON "hos_logs"("tenantId", "driverId", "date");

-- CreateIndex
CREATE INDEX "maintenance_records_tenantId_vehicleId_idx" ON "maintenance_records"("tenantId", "vehicleId");

-- CreateIndex
CREATE INDEX "documents_tenantId_entityId_idx" ON "documents"("tenantId", "entityId");

-- CreateIndex
CREATE INDEX "documents_tenantId_expiresAt_idx" ON "documents"("tenantId", "expiresAt");

-- CreateIndex
CREATE INDEX "_DocumentToVehicle_B_index" ON "_DocumentToVehicle"("B");

-- CreateIndex
CREATE INDEX "_DocumentToUser_B_index" ON "_DocumentToUser"("B");

-- AddForeignKey
ALTER TABLE "driver_scores" ADD CONSTRAINT "driver_scores_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver_scores" ADD CONSTRAINT "driver_scores_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hos_logs" ADD CONSTRAINT "hos_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hos_logs" ADD CONSTRAINT "hos_logs_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hos_logs" ADD CONSTRAINT "hos_logs_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToVehicle" ADD CONSTRAINT "_DocumentToVehicle_A_fkey" FOREIGN KEY ("A") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToVehicle" ADD CONSTRAINT "_DocumentToVehicle_B_fkey" FOREIGN KEY ("B") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToUser" ADD CONSTRAINT "_DocumentToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DocumentToUser" ADD CONSTRAINT "_DocumentToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
