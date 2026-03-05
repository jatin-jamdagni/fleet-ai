-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "annualKmTarget" DOUBLE PRECISION,
ADD COLUMN     "businessRegNo" TEXT,
ADD COLUMN     "cargoTypes" TEXT[],
ADD COLUMN     "countryCode" TEXT NOT NULL DEFAULT 'US',
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "fleetSizeTarget" INTEGER,
ADD COLUMN     "fleetType" TEXT NOT NULL DEFAULT 'mixed',
ADD COLUMN     "hasColdChain" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasHazmat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasOverdimension" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "operatingRegions" TEXT[],
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "requiresBOL" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresCustoms" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresPOD" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresWaybill" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "trip_manifests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "cargoDescription" TEXT,
    "cargoType" TEXT,
    "weightKg" DOUBLE PRECISION,
    "volumeM3" DOUBLE PRECISION,
    "pallets" INTEGER,
    "temperatureMin" DOUBLE PRECISION,
    "temperatureMax" DOUBLE PRECISION,
    "bolNumber" TEXT,
    "poNumber" TEXT,
    "waybillNumber" TEXT,
    "sealNumber" TEXT,
    "receiverName" TEXT,
    "receiverPhone" TEXT,
    "receiverAddress" TEXT,
    "deliveryNotes" TEXT,
    "podSignedAt" TIMESTAMP(3),
    "podSignedBy" TEXT,
    "podImageUrl" TEXT,
    "customsDeclaration" TEXT,
    "hsCode" TEXT,
    "originCountry" TEXT,
    "destinationCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_manifests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_waypoints" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "arrivedAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "durationMin" INTEGER,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "trip_waypoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_cards" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "ratePerKm" DOUBLE PRECISION NOT NULL DEFAULT 1.50,
    "ratePerHour" DOUBLE PRECISION,
    "baseCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waitingPerMin" DOUBLE PRECISION,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxLabel" TEXT NOT NULL DEFAULT 'Tax',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_manifests_tripId_key" ON "trip_manifests"("tripId");

-- CreateIndex
CREATE INDEX "trip_manifests_tenantId_idx" ON "trip_manifests"("tenantId");

-- CreateIndex
CREATE INDEX "trip_waypoints_tenantId_tripId_idx" ON "trip_waypoints"("tenantId", "tripId");

-- CreateIndex
CREATE UNIQUE INDEX "rate_cards_tenantId_key" ON "rate_cards"("tenantId");

-- AddForeignKey
ALTER TABLE "trip_manifests" ADD CONSTRAINT "trip_manifests_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_waypoints" ADD CONSTRAINT "trip_waypoints_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_cards" ADD CONSTRAINT "rate_cards_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
