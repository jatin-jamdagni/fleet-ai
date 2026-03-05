import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const TripWaypointPlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    tripId: t.String(),
    sequence: t.Integer(),
    label: t.String(),
    address: __nullable__(t.String()),
    lat: __nullable__(t.Number()),
    lng: __nullable__(t.Number()),
    arrivedAt: __nullable__(t.Date()),
    departedAt: __nullable__(t.Date()),
    durationMin: __nullable__(t.Integer()),
    notes: __nullable__(t.String()),
    status: t.String(),
  },
  { additionalProperties: false },
);

export const TripWaypointRelations = t.Object(
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

export const TripWaypointPlainInputCreate = t.Object(
  {
    sequence: t.Integer(),
    label: t.String(),
    address: t.Optional(__nullable__(t.String())),
    lat: t.Optional(__nullable__(t.Number())),
    lng: t.Optional(__nullable__(t.Number())),
    arrivedAt: t.Optional(__nullable__(t.Date())),
    departedAt: t.Optional(__nullable__(t.Date())),
    durationMin: t.Optional(__nullable__(t.Integer())),
    notes: t.Optional(__nullable__(t.String())),
    status: t.Optional(t.String()),
  },
  { additionalProperties: false },
);

export const TripWaypointPlainInputUpdate = t.Object(
  {
    sequence: t.Optional(t.Integer()),
    label: t.Optional(t.String()),
    address: t.Optional(__nullable__(t.String())),
    lat: t.Optional(__nullable__(t.Number())),
    lng: t.Optional(__nullable__(t.Number())),
    arrivedAt: t.Optional(__nullable__(t.Date())),
    departedAt: t.Optional(__nullable__(t.Date())),
    durationMin: t.Optional(__nullable__(t.Integer())),
    notes: t.Optional(__nullable__(t.String())),
    status: t.Optional(t.String()),
  },
  { additionalProperties: false },
);

export const TripWaypointRelationsInputCreate = t.Object(
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

export const TripWaypointRelationsInputUpdate = t.Partial(
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

export const TripWaypointWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          tenantId: t.String(),
          tripId: t.String(),
          sequence: t.Integer(),
          label: t.String(),
          address: t.String(),
          lat: t.Number(),
          lng: t.Number(),
          arrivedAt: t.Date(),
          departedAt: t.Date(),
          durationMin: t.Integer(),
          notes: t.String(),
          status: t.String(),
        },
        { additionalProperties: false },
      ),
    { $id: "TripWaypoint" },
  ),
);

export const TripWaypointWhereUnique = t.Recursive(
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
              tripId: t.String(),
              sequence: t.Integer(),
              label: t.String(),
              address: t.String(),
              lat: t.Number(),
              lng: t.Number(),
              arrivedAt: t.Date(),
              departedAt: t.Date(),
              durationMin: t.Integer(),
              notes: t.String(),
              status: t.String(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "TripWaypoint" },
);

export const TripWaypointSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tripId: t.Boolean(),
      trip: t.Boolean(),
      sequence: t.Boolean(),
      label: t.Boolean(),
      address: t.Boolean(),
      lat: t.Boolean(),
      lng: t.Boolean(),
      arrivedAt: t.Boolean(),
      departedAt: t.Boolean(),
      durationMin: t.Boolean(),
      notes: t.Boolean(),
      status: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const TripWaypointInclude = t.Partial(
  t.Object(
    { trip: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const TripWaypointOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tripId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      sequence: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      label: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      address: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lat: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lng: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      arrivedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      departedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      durationMin: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      notes: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      status: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const TripWaypoint = t.Composite(
  [TripWaypointPlain, TripWaypointRelations],
  { additionalProperties: false },
);

export const TripWaypointInputCreate = t.Composite(
  [TripWaypointPlainInputCreate, TripWaypointRelationsInputCreate],
  { additionalProperties: false },
);

export const TripWaypointInputUpdate = t.Composite(
  [TripWaypointPlainInputUpdate, TripWaypointRelationsInputUpdate],
  { additionalProperties: false },
);
