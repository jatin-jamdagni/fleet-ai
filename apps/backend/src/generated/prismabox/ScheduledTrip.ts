import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ScheduledTripPlain = t.Object(
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
);

export const ScheduledTripRelations = t.Object(
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
    createdBy: t.Object(
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
  },
  { additionalProperties: false },
);

export const ScheduledTripPlainInputCreate = t.Object(
  {
    title: t.String(),
    notes: t.Optional(__nullable__(t.String())),
    scheduledAt: t.Date(),
    reminderSentAt: t.Optional(__nullable__(t.Date())),
    status: t.Optional(
      t.Union(
        [
          t.Literal("PENDING"),
          t.Literal("NOTIFIED"),
          t.Literal("STARTED"),
          t.Literal("COMPLETED"),
          t.Literal("CANCELED"),
        ],
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const ScheduledTripPlainInputUpdate = t.Object(
  {
    title: t.Optional(t.String()),
    notes: t.Optional(__nullable__(t.String())),
    scheduledAt: t.Optional(t.Date()),
    reminderSentAt: t.Optional(__nullable__(t.Date())),
    status: t.Optional(
      t.Union(
        [
          t.Literal("PENDING"),
          t.Literal("NOTIFIED"),
          t.Literal("STARTED"),
          t.Literal("COMPLETED"),
          t.Literal("CANCELED"),
        ],
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const ScheduledTripRelationsInputCreate = t.Object(
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
    createdBy: t.Object(
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
  },
  { additionalProperties: false },
);

export const ScheduledTripRelationsInputUpdate = t.Partial(
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
      createdBy: t.Object(
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
    },
    { additionalProperties: false },
  ),
);

export const ScheduledTripWhere = t.Partial(
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
          title: t.String(),
          notes: t.String(),
          scheduledAt: t.Date(),
          reminderSentAt: t.Date(),
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
    { $id: "ScheduledTrip" },
  ),
);

export const ScheduledTripWhereUnique = t.Recursive(
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
              title: t.String(),
              notes: t.String(),
              scheduledAt: t.Date(),
              reminderSentAt: t.Date(),
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
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "ScheduledTrip" },
);

export const ScheduledTripSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      vehicleId: t.Boolean(),
      vehicle: t.Boolean(),
      driverId: t.Boolean(),
      driver: t.Boolean(),
      title: t.Boolean(),
      notes: t.Boolean(),
      scheduledAt: t.Boolean(),
      reminderSentAt: t.Boolean(),
      status: t.Boolean(),
      createdById: t.Boolean(),
      createdBy: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ScheduledTripInclude = t.Partial(
  t.Object(
    {
      tenant: t.Boolean(),
      vehicle: t.Boolean(),
      driver: t.Boolean(),
      status: t.Boolean(),
      createdBy: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ScheduledTripOrderBy = t.Partial(
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
      title: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      notes: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      scheduledAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      reminderSentAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdById: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const ScheduledTrip = t.Composite(
  [ScheduledTripPlain, ScheduledTripRelations],
  { additionalProperties: false },
);

export const ScheduledTripInputCreate = t.Composite(
  [ScheduledTripPlainInputCreate, ScheduledTripRelationsInputCreate],
  { additionalProperties: false },
);

export const ScheduledTripInputUpdate = t.Composite(
  [ScheduledTripPlainInputUpdate, ScheduledTripRelationsInputUpdate],
  { additionalProperties: false },
);
