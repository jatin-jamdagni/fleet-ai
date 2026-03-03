import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const AuditLogPlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    userId: t.String(),
    action: t.String(),
    entityType: t.String(),
    entityId: t.String(),
    metadata: t.Any(),
    createdAt: t.Date(),
  },
  { additionalProperties: false },
);

export const AuditLogRelations = t.Object({}, { additionalProperties: false });

export const AuditLogPlainInputCreate = t.Object(
  { action: t.String(), entityType: t.String(), metadata: t.Optional(t.Any()) },
  { additionalProperties: false },
);

export const AuditLogPlainInputUpdate = t.Object(
  {
    action: t.Optional(t.String()),
    entityType: t.Optional(t.String()),
    metadata: t.Optional(t.Any()),
  },
  { additionalProperties: false },
);

export const AuditLogRelationsInputCreate = t.Object(
  {},
  { additionalProperties: false },
);

export const AuditLogRelationsInputUpdate = t.Partial(
  t.Object({}, { additionalProperties: false }),
);

export const AuditLogWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          tenantId: t.String(),
          userId: t.String(),
          action: t.String(),
          entityType: t.String(),
          entityId: t.String(),
          metadata: t.Any(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "AuditLog" },
  ),
);

export const AuditLogWhereUnique = t.Recursive(
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
              userId: t.String(),
              action: t.String(),
              entityType: t.String(),
              entityId: t.String(),
              metadata: t.Any(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "AuditLog" },
);

export const AuditLogSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      userId: t.Boolean(),
      action: t.Boolean(),
      entityType: t.Boolean(),
      entityId: t.Boolean(),
      metadata: t.Boolean(),
      createdAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const AuditLogInclude = t.Partial(
  t.Object({ _count: t.Boolean() }, { additionalProperties: false }),
);

export const AuditLogOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      userId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      action: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      entityType: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      entityId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      metadata: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const AuditLog = t.Composite([AuditLogPlain, AuditLogRelations], {
  additionalProperties: false,
});

export const AuditLogInputCreate = t.Composite(
  [AuditLogPlainInputCreate, AuditLogRelationsInputCreate],
  { additionalProperties: false },
);

export const AuditLogInputUpdate = t.Composite(
  [AuditLogPlainInputUpdate, AuditLogRelationsInputUpdate],
  { additionalProperties: false },
);
