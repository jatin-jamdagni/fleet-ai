import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const HosLogPlain = t.Object(
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
);

export const HosLogRelations = t.Object(
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
    trip: __nullable__(
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
    ),
  },
  { additionalProperties: false },
);

export const HosLogPlainInputCreate = t.Object(
  {
    date: t.Date(),
    drivingMin: t.Optional(t.Integer()),
    onDutyMin: t.Optional(t.Integer()),
  },
  { additionalProperties: false },
);

export const HosLogPlainInputUpdate = t.Object(
  {
    date: t.Optional(t.Date()),
    drivingMin: t.Optional(t.Integer()),
    onDutyMin: t.Optional(t.Integer()),
  },
  { additionalProperties: false },
);

export const HosLogRelationsInputCreate = t.Object(
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
    trip: t.Optional(
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
  },
  { additionalProperties: false },
);

export const HosLogRelationsInputUpdate = t.Partial(
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
      trip: t.Partial(
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
    },
    { additionalProperties: false },
  ),
);

export const HosLogWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          tenantId: t.String(),
          driverId: t.String(),
          tripId: t.String(),
          date: t.Date(),
          drivingMin: t.Integer(),
          onDutyMin: t.Integer(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "HosLog" },
  ),
);

export const HosLogWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.String(),
              tenantId_driverId_date: t.Object(
                { tenantId: t.String(), driverId: t.String(), date: t.Date() },
                { additionalProperties: false },
              ),
            },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [
            t.Object({ id: t.String() }),
            t.Object({
              tenantId_driverId_date: t.Object(
                { tenantId: t.String(), driverId: t.String(), date: t.Date() },
                { additionalProperties: false },
              ),
            }),
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
              tenantId: t.String(),
              driverId: t.String(),
              tripId: t.String(),
              date: t.Date(),
              drivingMin: t.Integer(),
              onDutyMin: t.Integer(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "HosLog" },
);

export const HosLogSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      driverId: t.Boolean(),
      driver: t.Boolean(),
      tripId: t.Boolean(),
      trip: t.Boolean(),
      date: t.Boolean(),
      drivingMin: t.Boolean(),
      onDutyMin: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const HosLogInclude = t.Partial(
  t.Object(
    {
      tenant: t.Boolean(),
      driver: t.Boolean(),
      trip: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const HosLogOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      driverId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tripId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      date: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      drivingMin: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      onDutyMin: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const HosLog = t.Composite([HosLogPlain, HosLogRelations], {
  additionalProperties: false,
});

export const HosLogInputCreate = t.Composite(
  [HosLogPlainInputCreate, HosLogRelationsInputCreate],
  { additionalProperties: false },
);

export const HosLogInputUpdate = t.Composite(
  [HosLogPlainInputUpdate, HosLogRelationsInputUpdate],
  { additionalProperties: false },
);
