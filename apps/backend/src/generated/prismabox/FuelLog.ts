import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const FuelLogPlain = t.Object(
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
);

export const FuelLogRelations = t.Object(
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
    loggedBy: t.Object(
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

export const FuelLogPlainInputCreate = t.Object(
  {
    litres: t.Number(),
    pricePerL: t.Number(),
    totalCost: t.Number(),
    odometerKm: t.Number(),
    fuelType: t.Optional(t.String()),
    station: t.Optional(__nullable__(t.String())),
    notes: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const FuelLogPlainInputUpdate = t.Object(
  {
    litres: t.Optional(t.Number()),
    pricePerL: t.Optional(t.Number()),
    totalCost: t.Optional(t.Number()),
    odometerKm: t.Optional(t.Number()),
    fuelType: t.Optional(t.String()),
    station: t.Optional(__nullable__(t.String())),
    notes: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const FuelLogRelationsInputCreate = t.Object(
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
    loggedBy: t.Object(
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

export const FuelLogRelationsInputUpdate = t.Partial(
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
      loggedBy: t.Object(
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

export const FuelLogWhere = t.Partial(
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
          litres: t.Number(),
          pricePerL: t.Number(),
          totalCost: t.Number(),
          odometerKm: t.Number(),
          fuelType: t.String(),
          station: t.String(),
          notes: t.String(),
          loggedById: t.String(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "FuelLog" },
  ),
);

export const FuelLogWhereUnique = t.Recursive(
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
              litres: t.Number(),
              pricePerL: t.Number(),
              totalCost: t.Number(),
              odometerKm: t.Number(),
              fuelType: t.String(),
              station: t.String(),
              notes: t.String(),
              loggedById: t.String(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "FuelLog" },
);

export const FuelLogSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      vehicleId: t.Boolean(),
      vehicle: t.Boolean(),
      litres: t.Boolean(),
      pricePerL: t.Boolean(),
      totalCost: t.Boolean(),
      odometerKm: t.Boolean(),
      fuelType: t.Boolean(),
      station: t.Boolean(),
      notes: t.Boolean(),
      loggedById: t.Boolean(),
      loggedBy: t.Boolean(),
      createdAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const FuelLogInclude = t.Partial(
  t.Object(
    {
      tenant: t.Boolean(),
      vehicle: t.Boolean(),
      loggedBy: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const FuelLogOrderBy = t.Partial(
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
      litres: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      pricePerL: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      totalCost: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      odometerKm: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      fuelType: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      station: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      notes: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      loggedById: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const FuelLog = t.Composite([FuelLogPlain, FuelLogRelations], {
  additionalProperties: false,
});

export const FuelLogInputCreate = t.Composite(
  [FuelLogPlainInputCreate, FuelLogRelationsInputCreate],
  { additionalProperties: false },
);

export const FuelLogInputUpdate = t.Composite(
  [FuelLogPlainInputUpdate, FuelLogRelationsInputUpdate],
  { additionalProperties: false },
);
