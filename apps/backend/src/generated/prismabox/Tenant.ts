import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const TenantPlain = t.Object(
  {
    id: t.String(),
    name: t.String(),
    slug: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
    deletedAt: __nullable__(t.Date()),
    stripeCustomerId: __nullable__(t.String()),
    stripeSubscriptionId: __nullable__(t.String()),
    plan: t.Union(
      [
        t.Literal("TRIAL"),
        t.Literal("STARTER"),
        t.Literal("PROFESSIONAL"),
        t.Literal("ENTERPRISE"),
      ],
      { additionalProperties: false },
    ),
    planStatus: t.Union(
      [
        t.Literal("ACTIVE"),
        t.Literal("PAST_DUE"),
        t.Literal("CANCELED"),
        t.Literal("TRIALING"),
      ],
      { additionalProperties: false },
    ),
    trialEndsAt: __nullable__(t.Date()),
    currentPeriodEnd: __nullable__(t.Date()),
    cancelAtPeriodEnd: t.Boolean(),
    countryCode: t.String(),
    currency: t.String(),
    taxId: __nullable__(t.String()),
    businessRegNo: __nullable__(t.String()),
    phone: __nullable__(t.String()),
    website: __nullable__(t.String()),
    fleetType: t.String(),
    operatingRegions: t.Array(t.String(), { additionalProperties: false }),
    cargoTypes: t.Array(t.String(), { additionalProperties: false }),
    fleetSizeTarget: __nullable__(t.Integer()),
    annualKmTarget: __nullable__(t.Number()),
    requiresBOL: t.Boolean(),
    requiresPOD: t.Boolean(),
    requiresWaybill: t.Boolean(),
    requiresCustoms: t.Boolean(),
    hasColdChain: t.Boolean(),
    hasHazmat: t.Boolean(),
    hasOverdimension: t.Boolean(),
  },
  { additionalProperties: false },
);

export const TenantRelations = t.Object(
  {
    usageLogs: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          metric: t.String(),
          count: t.Integer(),
          date: t.Date(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    users: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          email: t.String(),
          passwordHash: t.String(),
          name: t.String(),
          role: t.Union(
            [
              t.Literal("SUPER_ADMIN"),
              t.Literal("FLEET_MANAGER"),
              t.Literal("DRIVER"),
            ],
            { additionalProperties: false },
          ),
          createdAt: t.Date(),
          updatedAt: t.Date(),
          deletedAt: __nullable__(t.Date()),
          lastLoginAt: __nullable__(t.Date()),
          licenceNumber: __nullable__(t.String()),
          licenceExpiry: __nullable__(t.Date()),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    vehicles: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          licensePlate: t.String(),
          make: t.String(),
          model: t.String(),
          year: t.Integer(),
          costPerKm: t.Number(),
          status: t.Union(
            [t.Literal("ACTIVE"), t.Literal("INACTIVE"), t.Literal("IN_TRIP")],
            { additionalProperties: false },
          ),
          assignedDriverId: __nullable__(t.String()),
          hasManual: t.Boolean(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
          deletedAt: __nullable__(t.Date()),
          odometerKm: t.Number(),
          maintenanceEveryKm: __nullable__(t.Number()),
          maintenanceDueKm: __nullable__(t.Number()),
          speedLimitKmh: __nullable__(t.Number()),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    trips: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          vehicleId: t.String(),
          driverId: t.String(),
          status: t.Union(
            [
              t.Literal("PENDING"),
              t.Literal("ACTIVE"),
              t.Literal("COMPLETED"),
              t.Literal("FORCE_ENDED"),
            ],
            { additionalProperties: false },
          ),
          startTime: t.Date(),
          endTime: __nullable__(t.Date()),
          distanceKm: __nullable__(t.Number()),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    invoices: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          tripId: t.String(),
          vehicleId: t.String(),
          driverId: t.String(),
          distanceKm: t.Number(),
          costPerKm: t.Number(),
          totalAmount: t.Number(),
          currency: t.String(),
          status: t.Union(
            [t.Literal("PENDING"), t.Literal("PAID"), t.Literal("VOID")],
            { additionalProperties: false },
          ),
          generatedAt: t.Date(),
          paidAt: __nullable__(t.Date()),
          subtotal: t.Number(),
          taxAmount: t.Number(),
          taxLabel: t.String(),
          taxRate: t.Number(),
          lineItems: __nullable__(t.Any()),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    aiLogs: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          driverId: t.String(),
          vehicleId: t.String(),
          question: t.String(),
          retrievedChunks: t.Any(),
          answer: t.String(),
          latencyMs: t.Integer(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    manualChunks: t.Array(
      t.Object(
        {
          id: t.String(),
          vehicleId: t.String(),
          tenantId: t.String(),
          content: t.String(),
          chunkIndex: t.Integer(),
          pageNumber: __nullable__(t.Integer()),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    notifications: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          userId: t.String(),
          type: t.Union(
            [
              t.Literal("TRIP_STARTED"),
              t.Literal("TRIP_ENDED"),
              t.Literal("TRIP_FORCE_ENDED"),
              t.Literal("INVOICE_GENERATED"),
              t.Literal("INVOICE_PAID"),
              t.Literal("VEHICLE_ASSIGNED"),
              t.Literal("DRIVER_INVITED"),
              t.Literal("PLAN_LIMIT_WARNING"),
              t.Literal("PAYMENT_FAILED"),
              t.Literal("SYSTEM"),
            ],
            { additionalProperties: false },
          ),
          title: t.String(),
          body: t.String(),
          data: __nullable__(t.Any()),
          read: t.Boolean(),
          readAt: __nullable__(t.Date()),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    geofences: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          name: t.String(),
          description: __nullable__(t.String()),
          color: t.String(),
          active: t.Boolean(),
          alertOnEnter: t.Boolean(),
          alertOnExit: t.Boolean(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
          deletedAt: __nullable__(t.Date()),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    scheduledTrips: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          vehicleId: t.String(),
          driverId: t.String(),
          title: t.String(),
          notes: __nullable__(t.String()),
          scheduledAt: t.Date(),
          reminderSentAt: __nullable__(t.Date()),
          status: t.Union(
            [
              t.Literal("PENDING"),
              t.Literal("NOTIFIED"),
              t.Literal("STARTED"),
              t.Literal("COMPLETED"),
              t.Literal("CANCELED"),
            ],
            { additionalProperties: false },
          ),
          createdById: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    documents: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          entityType: t.String(),
          entityId: t.String(),
          docType: t.String(),
          label: t.String(),
          expiresAt: __nullable__(t.Date()),
          fileUrl: __nullable__(t.String()),
          notifiedAt: __nullable__(t.Date()),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    maintenanceRecords: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          vehicleId: t.String(),
          type: t.String(),
          description: __nullable__(t.String()),
          odometer: t.Number(),
          cost: __nullable__(t.Number()),
          performedAt: t.Date(),
          nextDueKm: __nullable__(t.Number()),
          nextDueDateAt: __nullable__(t.Date()),
          notes: __nullable__(t.String()),
          createdById: t.String(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    hosLogs: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          driverId: t.String(),
          tripId: __nullable__(t.String()),
          date: t.Date(),
          drivingMin: t.Integer(),
          onDutyMin: t.Integer(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    driverScores: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          driverId: t.String(),
          date: t.Date(),
          totalTrips: t.Integer(),
          totalDistanceKm: t.Number(),
          avgSpeedKmh: t.Number(),
          maxSpeedKmh: t.Number(),
          speedingEvents: t.Integer(),
          hoursOnRoad: t.Number(),
          score: t.Number(),
          scoreBreakdown: __nullable__(t.Any()),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    settings: __nullable__(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          companyName: __nullable__(t.String()),
          logoUrl: __nullable__(t.String()),
          primaryColor: t.String(),
          accentColor: t.String(),
          customDomain: __nullable__(t.String()),
          timezone: t.String(),
          currency: t.String(),
          distanceUnit: t.String(),
          invoicePrefix: t.String(),
          invoiceFooter: __nullable__(t.String()),
          vatNumber: __nullable__(t.String()),
          address: __nullable__(t.String()),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    ),
    shareLinks: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          tripId: t.String(),
          token: t.String(),
          label: __nullable__(t.String()),
          expiresAt: __nullable__(t.Date()),
          viewCount: t.Integer(),
          createdById: t.String(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    apiKeys: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          name: t.String(),
          keyHash: t.String(),
          keyPrefix: t.String(),
          scopes: t.Array(t.String(), { additionalProperties: false }),
          lastUsedAt: __nullable__(t.Date()),
          expiresAt: __nullable__(t.Date()),
          createdById: t.String(),
          createdAt: t.Date(),
          revokedAt: __nullable__(t.Date()),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    integrationConfigs: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          provider: t.String(),
          enabled: t.Boolean(),
          config: t.Any(),
          lastSyncAt: __nullable__(t.Date()),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    fuelLogs: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          vehicleId: t.String(),
          litres: t.Number(),
          pricePerL: t.Number(),
          totalCost: t.Number(),
          odometerKm: t.Number(),
          fuelType: t.String(),
          station: __nullable__(t.String()),
          notes: __nullable__(t.String()),
          loggedById: t.String(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    webhookEndpoints: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          name: t.String(),
          url: t.String(),
          secret: t.String(),
          events: t.Array(t.String(), { additionalProperties: false }),
          active: t.Boolean(),
          createdById: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    rateCards: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          currency: t.String(),
          ratePerKm: t.Number(),
          ratePerHour: __nullable__(t.Number()),
          baseCharge: t.Number(),
          waitingPerMin: __nullable__(t.Number()),
          taxRate: t.Number(),
          taxLabel: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const TenantPlainInputCreate = t.Object(
  {
    name: t.String(),
    slug: t.String(),
    deletedAt: t.Optional(__nullable__(t.Date())),
    plan: t.Optional(
      t.Union(
        [
          t.Literal("TRIAL"),
          t.Literal("STARTER"),
          t.Literal("PROFESSIONAL"),
          t.Literal("ENTERPRISE"),
        ],
        { additionalProperties: false },
      ),
    ),
    planStatus: t.Optional(
      t.Union(
        [
          t.Literal("ACTIVE"),
          t.Literal("PAST_DUE"),
          t.Literal("CANCELED"),
          t.Literal("TRIALING"),
        ],
        { additionalProperties: false },
      ),
    ),
    trialEndsAt: t.Optional(__nullable__(t.Date())),
    currentPeriodEnd: t.Optional(__nullable__(t.Date())),
    cancelAtPeriodEnd: t.Optional(t.Boolean()),
    countryCode: t.Optional(t.String()),
    currency: t.Optional(t.String()),
    businessRegNo: t.Optional(__nullable__(t.String())),
    phone: t.Optional(__nullable__(t.String())),
    website: t.Optional(__nullable__(t.String())),
    fleetType: t.Optional(t.String()),
    operatingRegions: t.Array(t.String(), { additionalProperties: false }),
    cargoTypes: t.Array(t.String(), { additionalProperties: false }),
    fleetSizeTarget: t.Optional(__nullable__(t.Integer())),
    annualKmTarget: t.Optional(__nullable__(t.Number())),
    requiresBOL: t.Optional(t.Boolean()),
    requiresPOD: t.Optional(t.Boolean()),
    requiresWaybill: t.Optional(t.Boolean()),
    requiresCustoms: t.Optional(t.Boolean()),
    hasColdChain: t.Optional(t.Boolean()),
    hasHazmat: t.Optional(t.Boolean()),
    hasOverdimension: t.Optional(t.Boolean()),
  },
  { additionalProperties: false },
);

export const TenantPlainInputUpdate = t.Object(
  {
    name: t.Optional(t.String()),
    slug: t.Optional(t.String()),
    deletedAt: t.Optional(__nullable__(t.Date())),
    plan: t.Optional(
      t.Union(
        [
          t.Literal("TRIAL"),
          t.Literal("STARTER"),
          t.Literal("PROFESSIONAL"),
          t.Literal("ENTERPRISE"),
        ],
        { additionalProperties: false },
      ),
    ),
    planStatus: t.Optional(
      t.Union(
        [
          t.Literal("ACTIVE"),
          t.Literal("PAST_DUE"),
          t.Literal("CANCELED"),
          t.Literal("TRIALING"),
        ],
        { additionalProperties: false },
      ),
    ),
    trialEndsAt: t.Optional(__nullable__(t.Date())),
    currentPeriodEnd: t.Optional(__nullable__(t.Date())),
    cancelAtPeriodEnd: t.Optional(t.Boolean()),
    countryCode: t.Optional(t.String()),
    currency: t.Optional(t.String()),
    businessRegNo: t.Optional(__nullable__(t.String())),
    phone: t.Optional(__nullable__(t.String())),
    website: t.Optional(__nullable__(t.String())),
    fleetType: t.Optional(t.String()),
    operatingRegions: t.Optional(
      t.Array(t.String(), { additionalProperties: false }),
    ),
    cargoTypes: t.Optional(
      t.Array(t.String(), { additionalProperties: false }),
    ),
    fleetSizeTarget: t.Optional(__nullable__(t.Integer())),
    annualKmTarget: t.Optional(__nullable__(t.Number())),
    requiresBOL: t.Optional(t.Boolean()),
    requiresPOD: t.Optional(t.Boolean()),
    requiresWaybill: t.Optional(t.Boolean()),
    requiresCustoms: t.Optional(t.Boolean()),
    hasColdChain: t.Optional(t.Boolean()),
    hasHazmat: t.Optional(t.Boolean()),
    hasOverdimension: t.Optional(t.Boolean()),
  },
  { additionalProperties: false },
);

export const TenantRelationsInputCreate = t.Object(
  {
    usageLogs: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    users: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    vehicles: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    trips: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    invoices: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    aiLogs: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    manualChunks: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    notifications: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    geofences: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    scheduledTrips: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    documents: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    maintenanceRecords: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    hosLogs: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    driverScores: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    settings: t.Optional(
      t.Object(
        {
          connect: t.Object(
            {
              id: t.String({ additionalProperties: false }),
            },
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    shareLinks: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    apiKeys: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    integrationConfigs: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    fuelLogs: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    webhookEndpoints: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
    rateCards: t.Optional(
      t.Object(
        {
          connect: t.Array(
            t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            { additionalProperties: false },
          ),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const TenantRelationsInputUpdate = t.Partial(
  t.Object(
    {
      usageLogs: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      users: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      vehicles: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      trips: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      invoices: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      aiLogs: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      manualChunks: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      notifications: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      geofences: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      scheduledTrips: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      documents: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      maintenanceRecords: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      hosLogs: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      driverScores: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      settings: t.Partial(
        t.Object(
          {
            connect: t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            disconnect: t.Boolean(),
          },
          { additionalProperties: false },
        ),
      ),
      shareLinks: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      apiKeys: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      integrationConfigs: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      fuelLogs: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      webhookEndpoints: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
      rateCards: t.Partial(
        t.Object(
          {
            connect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
            disconnect: t.Array(
              t.Object(
                {
                  id: t.String({ additionalProperties: false }),
                },
                { additionalProperties: false },
              ),
              { additionalProperties: false },
            ),
          },
          { additionalProperties: false },
        ),
      ),
    },
    { additionalProperties: false },
  ),
);

export const TenantWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          name: t.String(),
          slug: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
          deletedAt: t.Date(),
          stripeCustomerId: t.String(),
          stripeSubscriptionId: t.String(),
          plan: t.Union(
            [
              t.Literal("TRIAL"),
              t.Literal("STARTER"),
              t.Literal("PROFESSIONAL"),
              t.Literal("ENTERPRISE"),
            ],
            { additionalProperties: false },
          ),
          planStatus: t.Union(
            [
              t.Literal("ACTIVE"),
              t.Literal("PAST_DUE"),
              t.Literal("CANCELED"),
              t.Literal("TRIALING"),
            ],
            { additionalProperties: false },
          ),
          trialEndsAt: t.Date(),
          currentPeriodEnd: t.Date(),
          cancelAtPeriodEnd: t.Boolean(),
          countryCode: t.String(),
          currency: t.String(),
          taxId: t.String(),
          businessRegNo: t.String(),
          phone: t.String(),
          website: t.String(),
          fleetType: t.String(),
          operatingRegions: t.Array(t.String(), {
            additionalProperties: false,
          }),
          cargoTypes: t.Array(t.String(), { additionalProperties: false }),
          fleetSizeTarget: t.Integer(),
          annualKmTarget: t.Number(),
          requiresBOL: t.Boolean(),
          requiresPOD: t.Boolean(),
          requiresWaybill: t.Boolean(),
          requiresCustoms: t.Boolean(),
          hasColdChain: t.Boolean(),
          hasHazmat: t.Boolean(),
          hasOverdimension: t.Boolean(),
        },
        { additionalProperties: false },
      ),
    { $id: "Tenant" },
  ),
);

export const TenantWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.String(),
              slug: t.String(),
              stripeCustomerId: t.String(),
              stripeSubscriptionId: t.String(),
            },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [
            t.Object({ id: t.String() }),
            t.Object({ slug: t.String() }),
            t.Object({ stripeCustomerId: t.String() }),
            t.Object({ stripeSubscriptionId: t.String() }),
          ],
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object({
            AND: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            NOT: t.Union([
              Self,
              t.Array(Self, { additionalProperties: false }),
            ]),
            OR: t.Array(Self, { additionalProperties: false }),
          }),
          { additionalProperties: false },
        ),
        t.Partial(
          t.Object(
            {
              id: t.String(),
              name: t.String(),
              slug: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
              deletedAt: t.Date(),
              stripeCustomerId: t.String(),
              stripeSubscriptionId: t.String(),
              plan: t.Union(
                [
                  t.Literal("TRIAL"),
                  t.Literal("STARTER"),
                  t.Literal("PROFESSIONAL"),
                  t.Literal("ENTERPRISE"),
                ],
                { additionalProperties: false },
              ),
              planStatus: t.Union(
                [
                  t.Literal("ACTIVE"),
                  t.Literal("PAST_DUE"),
                  t.Literal("CANCELED"),
                  t.Literal("TRIALING"),
                ],
                { additionalProperties: false },
              ),
              trialEndsAt: t.Date(),
              currentPeriodEnd: t.Date(),
              cancelAtPeriodEnd: t.Boolean(),
              countryCode: t.String(),
              currency: t.String(),
              taxId: t.String(),
              businessRegNo: t.String(),
              phone: t.String(),
              website: t.String(),
              fleetType: t.String(),
              operatingRegions: t.Array(t.String(), {
                additionalProperties: false,
              }),
              cargoTypes: t.Array(t.String(), { additionalProperties: false }),
              fleetSizeTarget: t.Integer(),
              annualKmTarget: t.Number(),
              requiresBOL: t.Boolean(),
              requiresPOD: t.Boolean(),
              requiresWaybill: t.Boolean(),
              requiresCustoms: t.Boolean(),
              hasColdChain: t.Boolean(),
              hasHazmat: t.Boolean(),
              hasOverdimension: t.Boolean(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Tenant" },
);

export const TenantSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      name: t.Boolean(),
      slug: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      deletedAt: t.Boolean(),
      stripeCustomerId: t.Boolean(),
      stripeSubscriptionId: t.Boolean(),
      plan: t.Boolean(),
      planStatus: t.Boolean(),
      trialEndsAt: t.Boolean(),
      currentPeriodEnd: t.Boolean(),
      cancelAtPeriodEnd: t.Boolean(),
      countryCode: t.Boolean(),
      currency: t.Boolean(),
      taxId: t.Boolean(),
      businessRegNo: t.Boolean(),
      phone: t.Boolean(),
      website: t.Boolean(),
      fleetType: t.Boolean(),
      operatingRegions: t.Boolean(),
      cargoTypes: t.Boolean(),
      fleetSizeTarget: t.Boolean(),
      annualKmTarget: t.Boolean(),
      requiresBOL: t.Boolean(),
      requiresPOD: t.Boolean(),
      requiresWaybill: t.Boolean(),
      requiresCustoms: t.Boolean(),
      hasColdChain: t.Boolean(),
      hasHazmat: t.Boolean(),
      hasOverdimension: t.Boolean(),
      usageLogs: t.Boolean(),
      users: t.Boolean(),
      vehicles: t.Boolean(),
      trips: t.Boolean(),
      invoices: t.Boolean(),
      aiLogs: t.Boolean(),
      manualChunks: t.Boolean(),
      notifications: t.Boolean(),
      geofences: t.Boolean(),
      scheduledTrips: t.Boolean(),
      documents: t.Boolean(),
      maintenanceRecords: t.Boolean(),
      hosLogs: t.Boolean(),
      driverScores: t.Boolean(),
      settings: t.Boolean(),
      shareLinks: t.Boolean(),
      apiKeys: t.Boolean(),
      integrationConfigs: t.Boolean(),
      fuelLogs: t.Boolean(),
      webhookEndpoints: t.Boolean(),
      rateCards: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const TenantInclude = t.Partial(
  t.Object(
    {
      plan: t.Boolean(),
      planStatus: t.Boolean(),
      usageLogs: t.Boolean(),
      users: t.Boolean(),
      vehicles: t.Boolean(),
      trips: t.Boolean(),
      invoices: t.Boolean(),
      aiLogs: t.Boolean(),
      manualChunks: t.Boolean(),
      notifications: t.Boolean(),
      geofences: t.Boolean(),
      scheduledTrips: t.Boolean(),
      documents: t.Boolean(),
      maintenanceRecords: t.Boolean(),
      hosLogs: t.Boolean(),
      driverScores: t.Boolean(),
      settings: t.Boolean(),
      shareLinks: t.Boolean(),
      apiKeys: t.Boolean(),
      integrationConfigs: t.Boolean(),
      fuelLogs: t.Boolean(),
      webhookEndpoints: t.Boolean(),
      rateCards: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const TenantOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      slug: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      updatedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      deletedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      stripeCustomerId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      stripeSubscriptionId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      trialEndsAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      currentPeriodEnd: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      cancelAtPeriodEnd: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      countryCode: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      currency: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      taxId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      businessRegNo: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      phone: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      website: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      fleetType: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      operatingRegions: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      cargoTypes: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      fleetSizeTarget: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      annualKmTarget: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      requiresBOL: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      requiresPOD: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      requiresWaybill: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      requiresCustoms: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      hasColdChain: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      hasHazmat: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      hasOverdimension: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Tenant = t.Composite([TenantPlain, TenantRelations], {
  additionalProperties: false,
});

export const TenantInputCreate = t.Composite(
  [TenantPlainInputCreate, TenantRelationsInputCreate],
  { additionalProperties: false },
);

export const TenantInputUpdate = t.Composite(
  [TenantPlainInputUpdate, TenantRelationsInputUpdate],
  { additionalProperties: false },
);
