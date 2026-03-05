-- CreateTable
CREATE TABLE "tenant_settings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyName" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "accentColor" TEXT NOT NULL DEFAULT '#ffffff',
    "customDomain" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "distanceUnit" TEXT NOT NULL DEFAULT 'km',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "invoiceFooter" TEXT,
    "vatNumber" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT,
    "expiresAt" TIMESTAMP(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_usage" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_tenantId_key" ON "tenant_settings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_settings_customDomain_key" ON "tenant_settings"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_key" ON "share_links"("token");

-- CreateIndex
CREATE INDEX "share_links_tenantId_idx" ON "share_links"("tenantId");

-- CreateIndex
CREATE INDEX "share_links_token_idx" ON "share_links"("token");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_tenantId_idx" ON "api_keys"("tenantId");

-- CreateIndex
CREATE INDEX "api_key_usage_apiKeyId_createdAt_idx" ON "api_key_usage"("apiKeyId", "createdAt");

-- AddForeignKey
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_key_usage" ADD CONSTRAINT "api_key_usage_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
