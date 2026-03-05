import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ApiKeyUsagePlain = t.Object(
  {
    id: t.String(),
    apiKeyId: t.String(),
    endpoint: t.String(),
    method: t.String(),
    status: t.Integer(),
    createdAt: t.Date(),
  },
  { additionalProperties: false },
);

export const ApiKeyUsageRelations = t.Object(
  {
    apiKey: t.Object(
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
    ),
  },
  { additionalProperties: false },
);

export const ApiKeyUsagePlainInputCreate = t.Object(
  { endpoint: t.String(), method: t.String(), status: t.Integer() },
  { additionalProperties: false },
);

export const ApiKeyUsagePlainInputUpdate = t.Object(
  {
    endpoint: t.Optional(t.String()),
    method: t.Optional(t.String()),
    status: t.Optional(t.Integer()),
  },
  { additionalProperties: false },
);

export const ApiKeyUsageRelationsInputCreate = t.Object(
  {
    apiKey: t.Object(
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

export const ApiKeyUsageRelationsInputUpdate = t.Partial(
  t.Object(
    {
      apiKey: t.Object(
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

export const ApiKeyUsageWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          apiKeyId: t.String(),
          endpoint: t.String(),
          method: t.String(),
          status: t.Integer(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "ApiKeyUsage" },
  ),
);

export const ApiKeyUsageWhereUnique = t.Recursive(
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
              apiKeyId: t.String(),
              endpoint: t.String(),
              method: t.String(),
              status: t.Integer(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "ApiKeyUsage" },
);

export const ApiKeyUsageSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      apiKeyId: t.Boolean(),
      apiKey: t.Boolean(),
      endpoint: t.Boolean(),
      method: t.Boolean(),
      status: t.Boolean(),
      createdAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ApiKeyUsageInclude = t.Partial(
  t.Object(
    { apiKey: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const ApiKeyUsageOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      apiKeyId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      endpoint: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      method: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      status: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const ApiKeyUsage = t.Composite(
  [ApiKeyUsagePlain, ApiKeyUsageRelations],
  { additionalProperties: false },
);

export const ApiKeyUsageInputCreate = t.Composite(
  [ApiKeyUsagePlainInputCreate, ApiKeyUsageRelationsInputCreate],
  { additionalProperties: false },
);

export const ApiKeyUsageInputUpdate = t.Composite(
  [ApiKeyUsagePlainInputUpdate, ApiKeyUsageRelationsInputUpdate],
  { additionalProperties: false },
);
