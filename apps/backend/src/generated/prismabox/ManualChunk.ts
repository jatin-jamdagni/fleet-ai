import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const ManualChunkPlain = t.Object(
  {
    id: t.String(),
    vehicleId: t.String(),
    tenantId: t.String(),
    content: t.String(),
    chunkIndex: t.Integer(),
    pageNumber: __nullable__(t.Integer()),
    createdAt: t.Date(),
  },
  { additionalProperties: false },
);

export const ManualChunkRelations = t.Object(
  {
    vehicle: t.Object(
      {
        id: t.String(),
        tenantId: t.String(),
        licensePlate: t.String(),
        make: t.String(),
        model: t.String(),
        year: t.Integer(),
        costPerKm: t.Number(),
        status: t.Union(
          [t.Literal("ACTIVE"), t.Literal("INACTIVE"), t.Literal("IN_TRIP")],
          { additionalProperties: false },
        ),
        assignedDriverId: __nullable__(t.String()),
        hasManual: t.Boolean(),
        createdAt: t.Date(),
        updatedAt: t.Date(),
        deletedAt: __nullable__(t.Date()),
      },
      { additionalProperties: false },
    ),
    tenant: t.Object(
      {
        id: t.String(),
        name: t.String(),
        slug: t.String(),
        plan: t.Union(
          [
            t.Literal("STARTER"),
            t.Literal("PROFESSIONAL"),
            t.Literal("ENTERPRISE"),
          ],
          { additionalProperties: false },
        ),
        createdAt: t.Date(),
        updatedAt: t.Date(),
        deletedAt: __nullable__(t.Date()),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const ManualChunkPlainInputCreate = t.Object(
  {
    content: t.String(),
    chunkIndex: t.Integer(),
    pageNumber: t.Optional(__nullable__(t.Integer())),
  },
  { additionalProperties: false },
);

export const ManualChunkPlainInputUpdate = t.Object(
  {
    content: t.Optional(t.String()),
    chunkIndex: t.Optional(t.Integer()),
    pageNumber: t.Optional(__nullable__(t.Integer())),
  },
  { additionalProperties: false },
);

export const ManualChunkRelationsInputCreate = t.Object(
  {
    vehicle: t.Object(
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

export const ManualChunkRelationsInputUpdate = t.Partial(
  t.Object(
    {
      vehicle: t.Object(
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

export const ManualChunkWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          vehicleId: t.String(),
          tenantId: t.String(),
          content: t.String(),
          chunkIndex: t.Integer(),
          pageNumber: t.Integer(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "ManualChunk" },
  ),
);

export const ManualChunkWhereUnique = t.Recursive(
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
              vehicleId: t.String(),
              tenantId: t.String(),
              content: t.String(),
              chunkIndex: t.Integer(),
              pageNumber: t.Integer(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "ManualChunk" },
);

export const ManualChunkSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      vehicleId: t.Boolean(),
      tenantId: t.Boolean(),
      content: t.Boolean(),
      chunkIndex: t.Boolean(),
      pageNumber: t.Boolean(),
      createdAt: t.Boolean(),
      vehicle: t.Boolean(),
      tenant: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const ManualChunkInclude = t.Partial(
  t.Object(
    { vehicle: t.Boolean(), tenant: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const ManualChunkOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      vehicleId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      content: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      chunkIndex: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      pageNumber: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const ManualChunk = t.Composite(
  [ManualChunkPlain, ManualChunkRelations],
  { additionalProperties: false },
);

export const ManualChunkInputCreate = t.Composite(
  [ManualChunkPlainInputCreate, ManualChunkRelationsInputCreate],
  { additionalProperties: false },
);

export const ManualChunkInputUpdate = t.Composite(
  [ManualChunkPlainInputUpdate, ManualChunkRelationsInputUpdate],
  { additionalProperties: false },
);
