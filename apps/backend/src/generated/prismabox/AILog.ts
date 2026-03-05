import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const AILogPlain = t.Object(
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
);

export const AILogRelations = t.Object(
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

export const AILogPlainInputCreate = t.Object(
  {
    question: t.String(),
    retrievedChunks: t.Optional(t.Any()),
    answer: t.String(),
    latencyMs: t.Integer(),
  },
  { additionalProperties: false },
);

export const AILogPlainInputUpdate = t.Object(
  {
    question: t.Optional(t.String()),
    retrievedChunks: t.Optional(t.Any()),
    answer: t.Optional(t.String()),
    latencyMs: t.Optional(t.Integer()),
  },
  { additionalProperties: false },
);

export const AILogRelationsInputCreate = t.Object(
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

export const AILogRelationsInputUpdate = t.Partial(
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

export const AILogWhere = t.Partial(
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
          vehicleId: t.String(),
          question: t.String(),
          retrievedChunks: t.Any(),
          answer: t.String(),
          latencyMs: t.Integer(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "AILog" },
  ),
);

export const AILogWhereUnique = t.Recursive(
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
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "AILog" },
);

export const AILogSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      driverId: t.Boolean(),
      vehicleId: t.Boolean(),
      question: t.Boolean(),
      retrievedChunks: t.Boolean(),
      answer: t.Boolean(),
      latencyMs: t.Boolean(),
      createdAt: t.Boolean(),
      tenant: t.Boolean(),
      driver: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const AILogInclude = t.Partial(
  t.Object(
    { tenant: t.Boolean(), driver: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const AILogOrderBy = t.Partial(
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
      vehicleId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      question: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      retrievedChunks: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      answer: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      latencyMs: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const AILog = t.Composite([AILogPlain, AILogRelations], {
  additionalProperties: false,
});

export const AILogInputCreate = t.Composite(
  [AILogPlainInputCreate, AILogRelationsInputCreate],
  { additionalProperties: false },
);

export const AILogInputUpdate = t.Composite(
  [AILogPlainInputUpdate, AILogRelationsInputUpdate],
  { additionalProperties: false },
);
