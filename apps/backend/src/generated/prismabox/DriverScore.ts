import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const DriverScorePlain = t.Object(
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
);

export const DriverScoreRelations = t.Object(
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
  },
  { additionalProperties: false },
);

export const DriverScorePlainInputCreate = t.Object(
  {
    date: t.Date(),
    totalTrips: t.Optional(t.Integer()),
    totalDistanceKm: t.Optional(t.Number()),
    avgSpeedKmh: t.Optional(t.Number()),
    maxSpeedKmh: t.Optional(t.Number()),
    speedingEvents: t.Optional(t.Integer()),
    hoursOnRoad: t.Optional(t.Number()),
    score: t.Optional(t.Number()),
    scoreBreakdown: t.Optional(__nullable__(t.Any())),
  },
  { additionalProperties: false },
);

export const DriverScorePlainInputUpdate = t.Object(
  {
    date: t.Optional(t.Date()),
    totalTrips: t.Optional(t.Integer()),
    totalDistanceKm: t.Optional(t.Number()),
    avgSpeedKmh: t.Optional(t.Number()),
    maxSpeedKmh: t.Optional(t.Number()),
    speedingEvents: t.Optional(t.Integer()),
    hoursOnRoad: t.Optional(t.Number()),
    score: t.Optional(t.Number()),
    scoreBreakdown: t.Optional(__nullable__(t.Any())),
  },
  { additionalProperties: false },
);

export const DriverScoreRelationsInputCreate = t.Object(
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
  },
  { additionalProperties: false },
);

export const DriverScoreRelationsInputUpdate = t.Partial(
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
    },
    { additionalProperties: false },
  ),
);

export const DriverScoreWhere = t.Partial(
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
          date: t.Date(),
          totalTrips: t.Integer(),
          totalDistanceKm: t.Number(),
          avgSpeedKmh: t.Number(),
          maxSpeedKmh: t.Number(),
          speedingEvents: t.Integer(),
          hoursOnRoad: t.Number(),
          score: t.Number(),
          scoreBreakdown: t.Any(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "DriverScore" },
  ),
);

export const DriverScoreWhereUnique = t.Recursive(
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
              date: t.Date(),
              totalTrips: t.Integer(),
              totalDistanceKm: t.Number(),
              avgSpeedKmh: t.Number(),
              maxSpeedKmh: t.Number(),
              speedingEvents: t.Integer(),
              hoursOnRoad: t.Number(),
              score: t.Number(),
              scoreBreakdown: t.Any(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "DriverScore" },
);

export const DriverScoreSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      driverId: t.Boolean(),
      driver: t.Boolean(),
      date: t.Boolean(),
      totalTrips: t.Boolean(),
      totalDistanceKm: t.Boolean(),
      avgSpeedKmh: t.Boolean(),
      maxSpeedKmh: t.Boolean(),
      speedingEvents: t.Boolean(),
      hoursOnRoad: t.Boolean(),
      score: t.Boolean(),
      scoreBreakdown: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const DriverScoreInclude = t.Partial(
  t.Object(
    { tenant: t.Boolean(), driver: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const DriverScoreOrderBy = t.Partial(
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
      date: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      totalTrips: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      totalDistanceKm: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      avgSpeedKmh: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      maxSpeedKmh: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      speedingEvents: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      hoursOnRoad: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      score: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      scoreBreakdown: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const DriverScore = t.Composite(
  [DriverScorePlain, DriverScoreRelations],
  { additionalProperties: false },
);

export const DriverScoreInputCreate = t.Composite(
  [DriverScorePlainInputCreate, DriverScoreRelationsInputCreate],
  { additionalProperties: false },
);

export const DriverScoreInputUpdate = t.Composite(
  [DriverScorePlainInputUpdate, DriverScoreRelationsInputUpdate],
  { additionalProperties: false },
);
