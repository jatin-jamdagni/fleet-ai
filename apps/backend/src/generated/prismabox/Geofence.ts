import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const GeofencePlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    name: t.String(),
    description: __nullable__(t.String()),
    color: t.String(),
    active: t.Boolean(),
    alertOnEnter: t.Boolean(),
    alertOnExit: t.Boolean(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
    deletedAt: __nullable__(t.Date()),
  },
  { additionalProperties: false },
);

export const GeofenceRelations = t.Object(
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
    events: t.Array(
      t.Object(
        {
          id: t.String(),
          tenantId: t.String(),
          geofenceId: t.String(),
          tripId: t.String(),
          vehicleId: t.String(),
          driverId: __nullable__(t.String()),
          eventType: t.String(),
          lat: t.Number(),
          lng: t.Number(),
          occurredAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const GeofencePlainInputCreate = t.Object(
  {
    name: t.String(),
    description: t.Optional(__nullable__(t.String())),
    color: t.Optional(t.String()),
    active: t.Optional(t.Boolean()),
    alertOnEnter: t.Optional(t.Boolean()),
    alertOnExit: t.Optional(t.Boolean()),
    deletedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const GeofencePlainInputUpdate = t.Object(
  {
    name: t.Optional(t.String()),
    description: t.Optional(__nullable__(t.String())),
    color: t.Optional(t.String()),
    active: t.Optional(t.Boolean()),
    alertOnEnter: t.Optional(t.Boolean()),
    alertOnExit: t.Optional(t.Boolean()),
    deletedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const GeofenceRelationsInputCreate = t.Object(
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
    events: t.Optional(
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

export const GeofenceRelationsInputUpdate = t.Partial(
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
      events: t.Partial(
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

export const GeofenceWhere = t.Partial(
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
          description: t.String(),
          color: t.String(),
          active: t.Boolean(),
          alertOnEnter: t.Boolean(),
          alertOnExit: t.Boolean(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
          deletedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "Geofence" },
  ),
);

export const GeofenceWhereUnique = t.Recursive(
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
              name: t.String(),
              description: t.String(),
              color: t.String(),
              active: t.Boolean(),
              alertOnEnter: t.Boolean(),
              alertOnExit: t.Boolean(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
              deletedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Geofence" },
);

export const GeofenceSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      name: t.Boolean(),
      description: t.Boolean(),
      color: t.Boolean(),
      active: t.Boolean(),
      alertOnEnter: t.Boolean(),
      alertOnExit: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      deletedAt: t.Boolean(),
      events: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const GeofenceInclude = t.Partial(
  t.Object(
    { tenant: t.Boolean(), events: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const GeofenceOrderBy = t.Partial(
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
      description: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      color: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      active: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      alertOnEnter: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      alertOnExit: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      updatedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      deletedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Geofence = t.Composite([GeofencePlain, GeofenceRelations], {
  additionalProperties: false,
});

export const GeofenceInputCreate = t.Composite(
  [GeofencePlainInputCreate, GeofenceRelationsInputCreate],
  { additionalProperties: false },
);

export const GeofenceInputUpdate = t.Composite(
  [GeofencePlainInputUpdate, GeofenceRelationsInputUpdate],
  { additionalProperties: false },
);
