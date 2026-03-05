import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ApiKeyPlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    name: t.String(),
    keyHash: t.String(),
    keyPrefix: t.String(),
    scopes: t.Array(t.String(), { additionalProperties: false }),
    lastUsedAt: __nullable__(t.Date()),
    expiresAt: __nullable__(t.Date()),
    createdById: t.String(),
    createdAt: t.Date(),
    revokedAt: __nullable__(t.Date()),
  },
  { additionalProperties: false },
);

export const ApiKeyRelations = t.Object(
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
    usageLogs: t.Array(
      t.Object(
        {
          id: t.String(),
          apiKeyId: t.String(),
          endpoint: t.String(),
          method: t.String(),
          status: t.Integer(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const ApiKeyPlainInputCreate = t.Object(
  {
    name: t.String(),
    keyHash: t.String(),
    keyPrefix: t.String(),
    scopes: t.Array(t.String(), { additionalProperties: false }),
    lastUsedAt: t.Optional(__nullable__(t.Date())),
    expiresAt: t.Optional(__nullable__(t.Date())),
    revokedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const ApiKeyPlainInputUpdate = t.Object(
  {
    name: t.Optional(t.String()),
    keyHash: t.Optional(t.String()),
    keyPrefix: t.Optional(t.String()),
    scopes: t.Optional(t.Array(t.String(), { additionalProperties: false })),
    lastUsedAt: t.Optional(__nullable__(t.Date())),
    expiresAt: t.Optional(__nullable__(t.Date())),
    revokedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const ApiKeyRelationsInputCreate = t.Object(
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
    usageLogs: t.Optional(
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

export const ApiKeyRelationsInputUpdate = t.Partial(
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
      usageLogs: t.Partial(
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

export const ApiKeyWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          tenantId: t.String(),
          name: t.String(),
          keyHash: t.String(),
          keyPrefix: t.String(),
          scopes: t.Array(t.String(), { additionalProperties: false }),
          lastUsedAt: t.Date(),
          expiresAt: t.Date(),
          createdById: t.String(),
          createdAt: t.Date(),
          revokedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "ApiKey" },
  ),
);

export const ApiKeyWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String(), keyHash: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [t.Object({ id: t.String() }), t.Object({ keyHash: t.String() })],
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
              name: t.String(),
              keyHash: t.String(),
              keyPrefix: t.String(),
              scopes: t.Array(t.String(), { additionalProperties: false }),
              lastUsedAt: t.Date(),
              expiresAt: t.Date(),
              createdById: t.String(),
              createdAt: t.Date(),
              revokedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "ApiKey" },
);

export const ApiKeySelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      name: t.Boolean(),
      keyHash: t.Boolean(),
      keyPrefix: t.Boolean(),
      scopes: t.Boolean(),
      lastUsedAt: t.Boolean(),
      expiresAt: t.Boolean(),
      createdById: t.Boolean(),
      createdBy: t.Boolean(),
      createdAt: t.Boolean(),
      revokedAt: t.Boolean(),
      usageLogs: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ApiKeyInclude = t.Partial(
  t.Object(
    {
      tenant: t.Boolean(),
      createdBy: t.Boolean(),
      usageLogs: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ApiKeyOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      name: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      keyHash: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      keyPrefix: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      scopes: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lastUsedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      expiresAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdById: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      revokedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const ApiKey = t.Composite([ApiKeyPlain, ApiKeyRelations], {
  additionalProperties: false,
});

export const ApiKeyInputCreate = t.Composite(
  [ApiKeyPlainInputCreate, ApiKeyRelationsInputCreate],
  { additionalProperties: false },
);

export const ApiKeyInputUpdate = t.Composite(
  [ApiKeyPlainInputUpdate, ApiKeyRelationsInputUpdate],
  { additionalProperties: false },
);
