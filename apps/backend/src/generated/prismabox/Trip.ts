import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const TripPlain = t.Object(
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
);

export const TripRelations = t.Object(
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
    vehicle: t.Object(
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
    driver: t.Object(
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
    gpsPings: t.Array(
      t.Object(
        {
          id: t.String(),
          tripId: t.String(),
          lat: t.Number(),
          lng: t.Number(),
          speed: t.Number(),
          heading: t.Number(),
          timestamp: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    invoice: __nullable__(
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
    ),
    geofenceEvents: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          geofenceId: t.String(),
          tripId: t.String(),
          vehicleId: t.String(),
          driverId: __nullable__(t.String()),
          eventType: t.String(),
          lat: t.Number(),
          lng: t.Number(),
          occurredAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    speedingEvents: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          tripId: t.String(),
          vehicleId: t.String(),
          driverId: __nullable__(t.String()),
          speedKmh: t.Number(),
          limitKmh: t.Number(),
          lat: t.Number(),
          lng: t.Number(),
          occurredAt: t.Date(),
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
    manifest: __nullable__(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          tripId: t.String(),
          cargoDescription: __nullable__(t.String()),
          cargoType: __nullable__(t.String()),
          weightKg: __nullable__(t.Number()),
          volumeM3: __nullable__(t.Number()),
          pallets: __nullable__(t.Integer()),
          temperatureMin: __nullable__(t.Number()),
          temperatureMax: __nullable__(t.Number()),
          bolNumber: __nullable__(t.String()),
          poNumber: __nullable__(t.String()),
          waybillNumber: __nullable__(t.String()),
          sealNumber: __nullable__(t.String()),
          receiverName: __nullable__(t.String()),
          receiverPhone: __nullable__(t.String()),
          receiverAddress: __nullable__(t.String()),
          deliveryNotes: __nullable__(t.String()),
          podSignedAt: __nullable__(t.Date()),
          podSignedBy: __nullable__(t.String()),
          podImageUrl: __nullable__(t.String()),
          customsDeclaration: __nullable__(t.String()),
          hsCode: __nullable__(t.String()),
          originCountry: __nullable__(t.String()),
          destinationCountry: __nullable__(t.String()),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    ),
    waypoints: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          tripId: t.String(),
          sequence: t.Integer(),
          label: t.String(),
          address: __nullable__(t.String()),
          lat: __nullable__(t.Number()),
          lng: __nullable__(t.Number()),
          arrivedAt: __nullable__(t.Date()),
          departedAt: __nullable__(t.Date()),
          durationMin: __nullable__(t.Integer()),
          notes: __nullable__(t.String()),
          status: t.String(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const TripPlainInputCreate = t.Object(
  {
    status: t.Optional(
      t.Union(
        [
          t.Literal("PENDING"),
          t.Literal("ACTIVE"),
          t.Literal("COMPLETED"),
          t.Literal("FORCE_ENDED"),
        ],
        { additionalProperties: false },
      ),
    ),
    startTime: t.Optional(t.Date()),
    endTime: t.Optional(__nullable__(t.Date())),
    distanceKm: t.Optional(__nullable__(t.Number())),
  },
  { additionalProperties: false },
);

export const TripPlainInputUpdate = t.Object(
  {
    status: t.Optional(
      t.Union(
        [
          t.Literal("PENDING"),
          t.Literal("ACTIVE"),
          t.Literal("COMPLETED"),
          t.Literal("FORCE_ENDED"),
        ],
        { additionalProperties: false },
      ),
    ),
    startTime: t.Optional(t.Date()),
    endTime: t.Optional(__nullable__(t.Date())),
    distanceKm: t.Optional(__nullable__(t.Number())),
  },
  { additionalProperties: false },
);

export const TripRelationsInputCreate = t.Object(
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
    vehicle: t.Object(
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
    driver: t.Object(
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
    gpsPings: t.Optional(
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
    invoice: t.Optional(
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
    geofenceEvents: t.Optional(
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
    speedingEvents: t.Optional(
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
    manifest: t.Optional(
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
    waypoints: t.Optional(
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

export const TripRelationsInputUpdate = t.Partial(
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
      vehicle: t.Object(
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
      driver: t.Object(
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
      gpsPings: t.Partial(
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
      invoice: t.Partial(
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
      geofenceEvents: t.Partial(
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
      speedingEvents: t.Partial(
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
      manifest: t.Partial(
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
      waypoints: t.Partial(
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

export const TripWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
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
          endTime: t.Date(),
          distanceKm: t.Number(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "Trip" },
  ),
);

export const TripWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object({ id: t.String() }, { additionalProperties: false }),
          { additionalProperties: false },
        ),
        t.Union([t.Object({ id: t.String() })], {
          additionalProperties: false,
        }),
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
              endTime: t.Date(),
              distanceKm: t.Number(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Trip" },
);

export const TripSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      vehicleId: t.Boolean(),
      driverId: t.Boolean(),
      status: t.Boolean(),
      startTime: t.Boolean(),
      endTime: t.Boolean(),
      distanceKm: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      tenant: t.Boolean(),
      vehicle: t.Boolean(),
      driver: t.Boolean(),
      gpsPings: t.Boolean(),
      invoice: t.Boolean(),
      geofenceEvents: t.Boolean(),
      speedingEvents: t.Boolean(),
      hosLogs: t.Boolean(),
      shareLinks: t.Boolean(),
      manifest: t.Boolean(),
      waypoints: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const TripInclude = t.Partial(
  t.Object(
    {
      status: t.Boolean(),
      tenant: t.Boolean(),
      vehicle: t.Boolean(),
      driver: t.Boolean(),
      gpsPings: t.Boolean(),
      invoice: t.Boolean(),
      geofenceEvents: t.Boolean(),
      speedingEvents: t.Boolean(),
      hosLogs: t.Boolean(),
      shareLinks: t.Boolean(),
      manifest: t.Boolean(),
      waypoints: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const TripOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      vehicleId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      driverId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      startTime: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      endTime: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      distanceKm: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      updatedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Trip = t.Composite([TripPlain, TripRelations], {
  additionalProperties: false,
});

export const TripInputCreate = t.Composite(
  [TripPlainInputCreate, TripRelationsInputCreate],
  { additionalProperties: false },
);

export const TripInputUpdate = t.Composite(
  [TripPlainInputUpdate, TripRelationsInputUpdate],
  { additionalProperties: false },
);
