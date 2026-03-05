import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const IntegrationConfigPlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    provider: t.String(),
    enabled: t.Boolean(),
    config: t.Any(),
    lastSyncAt: __nullable__(t.Date()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const IntegrationConfigRelations = t.Object(
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

export const IntegrationConfigPlainInputCreate = t.Object(
  {
    provider: t.String(),
    enabled: t.Optional(t.Boolean()),
    config: t.Any(),
    lastSyncAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const IntegrationConfigPlainInputUpdate = t.Object(
  {
    provider: t.Optional(t.String()),
    enabled: t.Optional(t.Boolean()),
    config: t.Optional(t.Any()),
    lastSyncAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const IntegrationConfigRelationsInputCreate = t.Object(
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

export const IntegrationConfigRelationsInputUpdate = t.Partial(
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

export const IntegrationConfigWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          tenantId: t.String(),
          provider: t.String(),
          enabled: t.Boolean(),
          config: t.Any(),
          lastSyncAt: t.Date(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "IntegrationConfig" },
  ),
);

export const IntegrationConfigWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.String(),
              tenantId_provider: t.Object(
                { tenantId: t.String(), provider: t.String() },
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
              tenantId_provider: t.Object(
                { tenantId: t.String(), provider: t.String() },
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
              provider: t.String(),
              enabled: t.Boolean(),
              config: t.Any(),
              lastSyncAt: t.Date(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "IntegrationConfig" },
);

export const IntegrationConfigSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      provider: t.Boolean(),
      enabled: t.Boolean(),
      config: t.Boolean(),
      lastSyncAt: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const IntegrationConfigInclude = t.Partial(
  t.Object(
    { tenant: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const IntegrationConfigOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      provider: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      enabled: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      config: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lastSyncAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const IntegrationConfig = t.Composite(
  [IntegrationConfigPlain, IntegrationConfigRelations],
  { additionalProperties: false },
);

export const IntegrationConfigInputCreate = t.Composite(
  [IntegrationConfigPlainInputCreate, IntegrationConfigRelationsInputCreate],
  { additionalProperties: false },
);

export const IntegrationConfigInputUpdate = t.Composite(
  [IntegrationConfigPlainInputUpdate, IntegrationConfigRelationsInputUpdate],
  { additionalProperties: false },
);
