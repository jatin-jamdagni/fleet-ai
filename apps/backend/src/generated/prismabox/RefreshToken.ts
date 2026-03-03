import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const RefreshTokenPlain = t.Object(
  {
    id: t.String(),
    userId: t.String(),
    tokenHash: t.String(),
    expiresAt: t.Date(),
    createdAt: t.Date(),
    revokedAt: __nullable__(t.Date()),
  },
  { additionalProperties: false },
);

export const RefreshTokenRelations = t.Object(
  {},
  { additionalProperties: false },
);

export const RefreshTokenPlainInputCreate = t.Object(
  {
    tokenHash: t.String(),
    expiresAt: t.Date(),
    revokedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const RefreshTokenPlainInputUpdate = t.Object(
  {
    tokenHash: t.Optional(t.String()),
    expiresAt: t.Optional(t.Date()),
    revokedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const RefreshTokenRelationsInputCreate = t.Object(
  {},
  { additionalProperties: false },
);

export const RefreshTokenRelationsInputUpdate = t.Partial(
  t.Object({}, { additionalProperties: false }),
);

export const RefreshTokenWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          userId: t.String(),
          tokenHash: t.String(),
          expiresAt: t.Date(),
          createdAt: t.Date(),
          revokedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "RefreshToken" },
  ),
);

export const RefreshTokenWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String(), tokenHash: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [t.Object({ id: t.String() }), t.Object({ tokenHash: t.String() })],
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
              userId: t.String(),
              tokenHash: t.String(),
              expiresAt: t.Date(),
              createdAt: t.Date(),
              revokedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "RefreshToken" },
);

export const RefreshTokenSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      userId: t.Boolean(),
      tokenHash: t.Boolean(),
      expiresAt: t.Boolean(),
      createdAt: t.Boolean(),
      revokedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const RefreshTokenInclude = t.Partial(
  t.Object({ _count: t.Boolean() }, { additionalProperties: false }),
);

export const RefreshTokenOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      userId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tokenHash: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      expiresAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const RefreshToken = t.Composite(
  [RefreshTokenPlain, RefreshTokenRelations],
  { additionalProperties: false },
);

export const RefreshTokenInputCreate = t.Composite(
  [RefreshTokenPlainInputCreate, RefreshTokenRelationsInputCreate],
  { additionalProperties: false },
);

export const RefreshTokenInputUpdate = t.Composite(
  [RefreshTokenPlainInputUpdate, RefreshTokenRelationsInputUpdate],
  { additionalProperties: false },
);
