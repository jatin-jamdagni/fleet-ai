import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const MaintenanceRecordPlain = t.Object(
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
);

export const MaintenanceRecordRelations = t.Object(
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

export const MaintenanceRecordPlainInputCreate = t.Object(
  {
    type: t.String(),
    description: t.Optional(__nullable__(t.String())),
    odometer: t.Number(),
    cost: t.Optional(__nullable__(t.Number())),
    performedAt: t.Date(),
    nextDueKm: t.Optional(__nullable__(t.Number())),
    nextDueDateAt: t.Optional(__nullable__(t.Date())),
    notes: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const MaintenanceRecordPlainInputUpdate = t.Object(
  {
    type: t.Optional(t.String()),
    description: t.Optional(__nullable__(t.String())),
    odometer: t.Optional(t.Number()),
    cost: t.Optional(__nullable__(t.Number())),
    performedAt: t.Optional(t.Date()),
    nextDueKm: t.Optional(__nullable__(t.Number())),
    nextDueDateAt: t.Optional(__nullable__(t.Date())),
    notes: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const MaintenanceRecordRelationsInputCreate = t.Object(
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

export const MaintenanceRecordRelationsInputUpdate = t.Partial(
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

export const MaintenanceRecordWhere = t.Partial(
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
          type: t.String(),
          description: t.String(),
          odometer: t.Number(),
          cost: t.Number(),
          performedAt: t.Date(),
          nextDueKm: t.Number(),
          nextDueDateAt: t.Date(),
          notes: t.String(),
          createdById: t.String(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "MaintenanceRecord" },
  ),
);

export const MaintenanceRecordWhereUnique = t.Recursive(
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
              type: t.String(),
              description: t.String(),
              odometer: t.Number(),
              cost: t.Number(),
              performedAt: t.Date(),
              nextDueKm: t.Number(),
              nextDueDateAt: t.Date(),
              notes: t.String(),
              createdById: t.String(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "MaintenanceRecord" },
);

export const MaintenanceRecordSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      vehicleId: t.Boolean(),
      vehicle: t.Boolean(),
      type: t.Boolean(),
      description: t.Boolean(),
      odometer: t.Boolean(),
      cost: t.Boolean(),
      performedAt: t.Boolean(),
      nextDueKm: t.Boolean(),
      nextDueDateAt: t.Boolean(),
      notes: t.Boolean(),
      createdById: t.Boolean(),
      createdBy: t.Boolean(),
      createdAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const MaintenanceRecordInclude = t.Partial(
  t.Object(
    {
      tenant: t.Boolean(),
      vehicle: t.Boolean(),
      createdBy: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const MaintenanceRecordOrderBy = t.Partial(
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
      type: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      description: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      odometer: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      cost: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      performedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      nextDueKm: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      nextDueDateAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      notes: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdById: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const MaintenanceRecord = t.Composite(
  [MaintenanceRecordPlain, MaintenanceRecordRelations],
  { additionalProperties: false },
);

export const MaintenanceRecordInputCreate = t.Composite(
  [MaintenanceRecordPlainInputCreate, MaintenanceRecordRelationsInputCreate],
  { additionalProperties: false },
);

export const MaintenanceRecordInputUpdate = t.Composite(
  [MaintenanceRecordPlainInputUpdate, MaintenanceRecordRelationsInputUpdate],
  { additionalProperties: false },
);
