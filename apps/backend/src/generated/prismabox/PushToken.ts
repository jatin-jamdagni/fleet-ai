import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const PushTokenPlain = t.Object(
  {
    id: t.String(),
    userId: t.String(),
    token: t.String(),
    platform: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const PushTokenRelations = t.Object(
  {
    user: t.Object(
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

export const PushTokenPlainInputCreate = t.Object(
  { token: t.String(), platform: t.String() },
  { additionalProperties: false },
);

export const PushTokenPlainInputUpdate = t.Object(
  { token: t.Optional(t.String()), platform: t.Optional(t.String()) },
  { additionalProperties: false },
);

export const PushTokenRelationsInputCreate = t.Object(
  {
    user: t.Object(
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

export const PushTokenRelationsInputUpdate = t.Partial(
  t.Object(
    {
      user: t.Object(
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

export const PushTokenWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          userId: t.String(),
          token: t.String(),
          platform: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "PushToken" },
  ),
);

export const PushTokenWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.String(),
              userId_token: t.Object(
                { userId: t.String(), token: t.String() },
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
              userId_token: t.Object(
                { userId: t.String(), token: t.String() },
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
              userId: t.String(),
              token: t.String(),
              platform: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "PushToken" },
);

export const PushTokenSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      userId: t.Boolean(),
      user: t.Boolean(),
      token: t.Boolean(),
      platform: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const PushTokenInclude = t.Partial(
  t.Object(
    { user: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const PushTokenOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      userId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      token: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      platform: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const PushToken = t.Composite([PushTokenPlain, PushTokenRelations], {
  additionalProperties: false,
});

export const PushTokenInputCreate = t.Composite(
  [PushTokenPlainInputCreate, PushTokenRelationsInputCreate],
  { additionalProperties: false },
);

export const PushTokenInputUpdate = t.Composite(
  [PushTokenPlainInputUpdate, PushTokenRelationsInputUpdate],
  { additionalProperties: false },
);
