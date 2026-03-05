import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const SpeedingEventPlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    tripId: t.String(),
    vehicleId: t.String(),
    driverId: __nullable__(t.String()),
    speedKmh: t.Number(),
    limitKmh: t.Number(),
    lat: t.Number(),
    lng: t.Number(),
    occurredAt: t.Date(),
  },
  { additionalProperties: false },
);

export const SpeedingEventRelations = t.Object(
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
        odometerKm: t.Number(),
        maintenanceEveryKm: __nullable__(t.Number()),
        maintenanceDueKm: __nullable__(t.Number()),
        speedLimitKmh: __nullable__(t.Number()),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const SpeedingEventPlainInputCreate = t.Object(
  {
    speedKmh: t.Number(),
    limitKmh: t.Number(),
    lat: t.Number(),
    lng: t.Number(),
    occurredAt: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const SpeedingEventPlainInputUpdate = t.Object(
  {
    speedKmh: t.Optional(t.Number()),
    limitKmh: t.Optional(t.Number()),
    lat: t.Optional(t.Number()),
    lng: t.Optional(t.Number()),
    occurredAt: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const SpeedingEventRelationsInputCreate = t.Object(
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
  },
  { additionalProperties: false },
);

export const SpeedingEventRelationsInputUpdate = t.Partial(
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
    },
    { additionalProperties: false },
  ),
);

export const SpeedingEventWhere = t.Partial(
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
          vehicleId: t.String(),
          driverId: t.String(),
          speedKmh: t.Number(),
          limitKmh: t.Number(),
          lat: t.Number(),
          lng: t.Number(),
          occurredAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "SpeedingEvent" },
  ),
);

export const SpeedingEventWhereUnique = t.Recursive(
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
              vehicleId: t.String(),
              driverId: t.String(),
              speedKmh: t.Number(),
              limitKmh: t.Number(),
              lat: t.Number(),
              lng: t.Number(),
              occurredAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "SpeedingEvent" },
);

export const SpeedingEventSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tripId: t.Boolean(),
      trip: t.Boolean(),
      vehicleId: t.Boolean(),
      vehicle: t.Boolean(),
      driverId: t.Boolean(),
      speedKmh: t.Boolean(),
      limitKmh: t.Boolean(),
      lat: t.Boolean(),
      lng: t.Boolean(),
      occurredAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const SpeedingEventInclude = t.Partial(
  t.Object(
    { trip: t.Boolean(), vehicle: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const SpeedingEventOrderBy = t.Partial(
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
      vehicleId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      driverId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      speedKmh: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      limitKmh: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lat: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lng: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      occurredAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const SpeedingEvent = t.Composite(
  [SpeedingEventPlain, SpeedingEventRelations],
  { additionalProperties: false },
);

export const SpeedingEventInputCreate = t.Composite(
  [SpeedingEventPlainInputCreate, SpeedingEventRelationsInputCreate],
  { additionalProperties: false },
);

export const SpeedingEventInputUpdate = t.Composite(
  [SpeedingEventPlainInputUpdate, SpeedingEventRelationsInputUpdate],
  { additionalProperties: false },
);
