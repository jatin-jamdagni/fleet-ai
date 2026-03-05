import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const RateCardPlain = t.Object(
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
);

export const RateCardRelations = t.Object(
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
  },
  { additionalProperties: false },
);

export const RateCardPlainInputCreate = t.Object(
  {
    currency: t.String(),
    ratePerKm: t.Optional(t.Number()),
    ratePerHour: t.Optional(__nullable__(t.Number())),
    baseCharge: t.Optional(t.Number()),
    waitingPerMin: t.Optional(__nullable__(t.Number())),
    taxRate: t.Optional(t.Number()),
    taxLabel: t.Optional(t.String()),
  },
  { additionalProperties: false },
);

export const RateCardPlainInputUpdate = t.Object(
  {
    currency: t.Optional(t.String()),
    ratePerKm: t.Optional(t.Number()),
    ratePerHour: t.Optional(__nullable__(t.Number())),
    baseCharge: t.Optional(t.Number()),
    waitingPerMin: t.Optional(__nullable__(t.Number())),
    taxRate: t.Optional(t.Number()),
    taxLabel: t.Optional(t.String()),
  },
  { additionalProperties: false },
);

export const RateCardRelationsInputCreate = t.Object(
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
  },
  { additionalProperties: false },
);

export const RateCardRelationsInputUpdate = t.Partial(
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
    },
    { additionalProperties: false },
  ),
);

export const RateCardWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          tenantId: t.String(),
          currency: t.String(),
          ratePerKm: t.Number(),
          ratePerHour: t.Number(),
          baseCharge: t.Number(),
          waitingPerMin: t.Number(),
          taxRate: t.Number(),
          taxLabel: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "RateCard" },
  ),
);

export const RateCardWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String(), tenantId: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [t.Object({ id: t.String() }), t.Object({ tenantId: t.String() })],
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
              currency: t.String(),
              ratePerKm: t.Number(),
              ratePerHour: t.Number(),
              baseCharge: t.Number(),
              waitingPerMin: t.Number(),
              taxRate: t.Number(),
              taxLabel: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "RateCard" },
);

export const RateCardSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      currency: t.Boolean(),
      ratePerKm: t.Boolean(),
      ratePerHour: t.Boolean(),
      baseCharge: t.Boolean(),
      waitingPerMin: t.Boolean(),
      taxRate: t.Boolean(),
      taxLabel: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const RateCardInclude = t.Partial(
  t.Object(
    { tenant: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const RateCardOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      currency: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      ratePerKm: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      ratePerHour: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      baseCharge: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      waitingPerMin: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      taxRate: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      taxLabel: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const RateCard = t.Composite([RateCardPlain, RateCardRelations], {
  additionalProperties: false,
});

export const RateCardInputCreate = t.Composite(
  [RateCardPlainInputCreate, RateCardRelationsInputCreate],
  { additionalProperties: false },
);

export const RateCardInputUpdate = t.Composite(
  [RateCardPlainInputUpdate, RateCardRelationsInputUpdate],
  { additionalProperties: false },
);
