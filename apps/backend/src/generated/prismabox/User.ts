import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const UserPlain = t.Object(
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
);

export const UserRelations = t.Object(
  {
    tenant: t.Object(
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
    ),
    vehicle: __nullable__(
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
    ),
    drivenTrips: t.Array(
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
    pushTokens: t.Array(
      t.Object(
        {
          id: t.String(),
          userId: t.String(),
          token: t.String(),
          platform: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
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
    createdScheduledTrips: t.Array(
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
    assignedScheduledTrips: t.Array(
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
  },
  { additionalProperties: false },
);

export const UserPlainInputCreate = t.Object(
  {
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
    deletedAt: t.Optional(__nullable__(t.Date())),
    lastLoginAt: t.Optional(__nullable__(t.Date())),
    licenceNumber: t.Optional(__nullable__(t.String())),
    licenceExpiry: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const UserPlainInputUpdate = t.Object(
  {
    email: t.Optional(t.String()),
    passwordHash: t.Optional(t.String()),
    name: t.Optional(t.String()),
    role: t.Optional(
      t.Union(
        [
          t.Literal("SUPER_ADMIN"),
          t.Literal("FLEET_MANAGER"),
          t.Literal("DRIVER"),
        ],
        { additionalProperties: false },
      ),
    ),
    deletedAt: t.Optional(__nullable__(t.Date())),
    lastLoginAt: t.Optional(__nullable__(t.Date())),
    licenceNumber: t.Optional(__nullable__(t.String())),
    licenceExpiry: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const UserRelationsInputCreate = t.Object(
  {
    tenant: t.Object(
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
    vehicle: t.Optional(
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
    drivenTrips: t.Optional(
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
    pushTokens: t.Optional(
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
    createdScheduledTrips: t.Optional(
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
    assignedScheduledTrips: t.Optional(
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
  },
  { additionalProperties: false },
);

export const UserRelationsInputUpdate = t.Partial(
  t.Object(
    {
      tenant: t.Object(
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
      vehicle: t.Partial(
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
      drivenTrips: t.Partial(
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
      pushTokens: t.Partial(
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
      createdScheduledTrips: t.Partial(
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
      assignedScheduledTrips: t.Partial(
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
    },
    { additionalProperties: false },
  ),
);

export const UserWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
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
          deletedAt: t.Date(),
          lastLoginAt: t.Date(),
          licenceNumber: t.String(),
          licenceExpiry: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "User" },
  ),
);

export const UserWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String(), email: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [t.Object({ id: t.String() }), t.Object({ email: t.String() })],
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
              deletedAt: t.Date(),
              lastLoginAt: t.Date(),
              licenceNumber: t.String(),
              licenceExpiry: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "User" },
);

export const UserSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      email: t.Boolean(),
      passwordHash: t.Boolean(),
      name: t.Boolean(),
      role: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      deletedAt: t.Boolean(),
      lastLoginAt: t.Boolean(),
      licenceNumber: t.Boolean(),
      licenceExpiry: t.Boolean(),
      tenant: t.Boolean(),
      vehicle: t.Boolean(),
      drivenTrips: t.Boolean(),
      aiLogs: t.Boolean(),
      pushTokens: t.Boolean(),
      notifications: t.Boolean(),
      createdScheduledTrips: t.Boolean(),
      assignedScheduledTrips: t.Boolean(),
      maintenanceRecords: t.Boolean(),
      hosLogs: t.Boolean(),
      driverScores: t.Boolean(),
      documents: t.Boolean(),
      apiKeys: t.Boolean(),
      shareLinks: t.Boolean(),
      fuelLogs: t.Boolean(),
      webhookEndpoints: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const UserInclude = t.Partial(
  t.Object(
    {
      role: t.Boolean(),
      tenant: t.Boolean(),
      vehicle: t.Boolean(),
      drivenTrips: t.Boolean(),
      aiLogs: t.Boolean(),
      pushTokens: t.Boolean(),
      notifications: t.Boolean(),
      createdScheduledTrips: t.Boolean(),
      assignedScheduledTrips: t.Boolean(),
      maintenanceRecords: t.Boolean(),
      hosLogs: t.Boolean(),
      driverScores: t.Boolean(),
      documents: t.Boolean(),
      apiKeys: t.Boolean(),
      shareLinks: t.Boolean(),
      fuelLogs: t.Boolean(),
      webhookEndpoints: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const UserOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      email: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      passwordHash: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal("asc"), t.Literal("desc")], {
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
      lastLoginAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      licenceNumber: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      licenceExpiry: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const User = t.Composite([UserPlain, UserRelations], {
  additionalProperties: false,
});

export const UserInputCreate = t.Composite(
  [UserPlainInputCreate, UserRelationsInputCreate],
  { additionalProperties: false },
);

export const UserInputUpdate = t.Composite(
  [UserPlainInputUpdate, UserRelationsInputUpdate],
  { additionalProperties: false },
);
