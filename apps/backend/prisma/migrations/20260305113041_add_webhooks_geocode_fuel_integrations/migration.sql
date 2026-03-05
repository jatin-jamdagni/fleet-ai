-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" INTEGER NOT NULL,
    "responseBody" TEXT,
    "durationMs" INTEGER,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geocode_cache" (
    "id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "geocode_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "litres" DOUBLE PRECISION NOT NULL,
    "pricePerL" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "odometerKm" DOUBLE PRECISION NOT NULL,
    "fuelType" TEXT NOT NULL DEFAULT 'diesel',
    "station" TEXT,
    "notes" TEXT,
    "loggedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_endpoints_tenantId_idx" ON "webhook_endpoints"("tenantId");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpointId_deliveredAt_idx" ON "webhook_deliveries"("endpointId", "deliveredAt");

-- CreateIndex
CREATE UNIQUE INDEX "geocode_cache_lat_lng_key" ON "geocode_cache"("lat", "lng");

-- CreateIndex
CREATE INDEX "fuel_logs_tenantId_vehicleId_idx" ON "fuel_logs"("tenantId", "vehicleId");

-- CreateIndex
CREATE INDEX "fuel_logs_tenantId_createdAt_idx" ON "fuel_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "integration_configs_tenantId_provider_key" ON "integration_configs"("tenantId", "provider");

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "webhook_endpoints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_logs" ADD CONSTRAINT "fuel_logs_loggedById_fkey" FOREIGN KEY ("loggedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_configs" ADD CONSTRAINT "integration_configs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
