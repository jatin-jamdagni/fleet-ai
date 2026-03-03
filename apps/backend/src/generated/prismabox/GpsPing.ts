import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const GpsPingPlain = t.Object(
  {
    id: t.String(),
    tripId: t.String(),
    lat: t.Number(),
    lng: t.Number(),
    speed: t.Number(),
    heading: t.Number(),
    timestamp: t.Date(),
  },
  { additionalProperties: false },
);

export const GpsPingRelations = t.Object(
  {
    trip: t.Object(
      {
        id: t.String(),
        tenantId: t.String(),
        vehicleId: t.String(),
        driverId: t.String(),
        status: t.Union(
          [
            t.Literal("PENDING"),
            t.Literal("ACTIVE"),
            t.Literal("COMPLETED"),
            t.Literal("FORCE_ENDED"),
          ],
          { additionalProperties: false },
        ),
        startTime: t.Date(),
        endTime: __nullable__(t.Date()),
        distanceKm: __nullable__(t.Number()),
        createdAt: t.Date(),
        updatedAt: t.Date(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const GpsPingPlainInputCreate = t.Object(
  {
    lat: t.Number(),
    lng: t.Number(),
    speed: t.Number(),
    heading: t.Optional(t.Number()),
    timestamp: t.Date(),
  },
  { additionalProperties: false },
);

export const GpsPingPlainInputUpdate = t.Object(
  {
    lat: t.Optional(t.Number()),
    lng: t.Optional(t.Number()),
    speed: t.Optional(t.Number()),
    heading: t.Optional(t.Number()),
    timestamp: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const GpsPingRelationsInputCreate = t.Object(
  {
    trip: t.Object(
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

export const GpsPingRelationsInputUpdate = t.Partial(
  t.Object(
    {
      trip: t.Object(
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

export const GpsPingWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          tripId: t.String(),
          lat: t.Number(),
          lng: t.Number(),
          speed: t.Number(),
          heading: t.Number(),
          timestamp: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "GpsPing" },
  ),
);

export const GpsPingWhereUnique = t.Recursive(
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
              tripId: t.String(),
              lat: t.Number(),
              lng: t.Number(),
              speed: t.Number(),
              heading: t.Number(),
              timestamp: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "GpsPing" },
);

export const GpsPingSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tripId: t.Boolean(),
      lat: t.Boolean(),
      lng: t.Boolean(),
      speed: t.Boolean(),
      heading: t.Boolean(),
      timestamp: t.Boolean(),
      trip: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const GpsPingInclude = t.Partial(
  t.Object(
    { trip: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const GpsPingOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tripId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lat: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lng: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      speed: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      heading: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      timestamp: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const GpsPing = t.Composite([GpsPingPlain, GpsPingRelations], {
  additionalProperties: false,
});

export const GpsPingInputCreate = t.Composite(
  [GpsPingPlainInputCreate, GpsPingRelationsInputCreate],
  { additionalProperties: false },
);

export const GpsPingInputUpdate = t.Composite(
  [GpsPingPlainInputUpdate, GpsPingRelationsInputUpdate],
  { additionalProperties: false },
);
