import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const UsageLogPlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    metric: t.String(),
    count: t.Integer(),
    date: t.Date(),
    createdAt: t.Date(),
  },
  { additionalProperties: false },
);

export const UsageLogRelations = t.Object(
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

export const UsageLogPlainInputCreate = t.Object(
  {
    metric: t.String(),
    count: t.Optional(t.Integer()),
    date: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const UsageLogPlainInputUpdate = t.Object(
  {
    metric: t.Optional(t.String()),
    count: t.Optional(t.Integer()),
    date: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const UsageLogRelationsInputCreate = t.Object(
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

export const UsageLogRelationsInputUpdate = t.Partial(
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

export const UsageLogWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          tenantId: t.String(),
          metric: t.String(),
          count: t.Integer(),
          date: t.Date(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "UsageLog" },
  ),
);

export const UsageLogWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.String(),
              tenantId_metric_date: t.Object(
                { tenantId: t.String(), metric: t.String(), date: t.Date() },
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
              tenantId_metric_date: t.Object(
                { tenantId: t.String(), metric: t.String(), date: t.Date() },
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
              metric: t.String(),
              count: t.Integer(),
              date: t.Date(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "UsageLog" },
);

export const UsageLogSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      metric: t.Boolean(),
      count: t.Boolean(),
      date: t.Boolean(),
      createdAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const UsageLogInclude = t.Partial(
  t.Object(
    { tenant: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const UsageLogOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      metric: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      count: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      date: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const UsageLog = t.Composite([UsageLogPlain, UsageLogRelations], {
  additionalProperties: false,
});

export const UsageLogInputCreate = t.Composite(
  [UsageLogPlainInputCreate, UsageLogRelationsInputCreate],
  { additionalProperties: false },
);

export const UsageLogInputUpdate = t.Composite(
  [UsageLogPlainInputUpdate, UsageLogRelationsInputUpdate],
  { additionalProperties: false },
);
