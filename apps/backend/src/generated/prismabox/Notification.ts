import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const NotificationPlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    userId: t.String(),
    type: t.Union(
      [
        t.Literal("TRIP_STARTED"),
        t.Literal("TRIP_ENDED"),
        t.Literal("TRIP_FORCE_ENDED"),
        t.Literal("INVOICE_GENERATED"),
        t.Literal("INVOICE_PAID"),
        t.Literal("VEHICLE_ASSIGNED"),
        t.Literal("DRIVER_INVITED"),
        t.Literal("PLAN_LIMIT_WARNING"),
        t.Literal("PAYMENT_FAILED"),
        t.Literal("SYSTEM"),
      ],
      { additionalProperties: false },
    ),
    title: t.String(),
    body: t.String(),
    data: __nullable__(t.Any()),
    read: t.Boolean(),
    readAt: __nullable__(t.Date()),
    createdAt: t.Date(),
  },
  { additionalProperties: false },
);

export const NotificationRelations = t.Object(
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

export const NotificationPlainInputCreate = t.Object(
  {
    type: t.Union(
      [
        t.Literal("TRIP_STARTED"),
        t.Literal("TRIP_ENDED"),
        t.Literal("TRIP_FORCE_ENDED"),
        t.Literal("INVOICE_GENERATED"),
        t.Literal("INVOICE_PAID"),
        t.Literal("VEHICLE_ASSIGNED"),
        t.Literal("DRIVER_INVITED"),
        t.Literal("PLAN_LIMIT_WARNING"),
        t.Literal("PAYMENT_FAILED"),
        t.Literal("SYSTEM"),
      ],
      { additionalProperties: false },
    ),
    title: t.String(),
    body: t.String(),
    data: t.Optional(__nullable__(t.Any())),
    read: t.Optional(t.Boolean()),
    readAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const NotificationPlainInputUpdate = t.Object(
  {
    type: t.Optional(
      t.Union(
        [
          t.Literal("TRIP_STARTED"),
          t.Literal("TRIP_ENDED"),
          t.Literal("TRIP_FORCE_ENDED"),
          t.Literal("INVOICE_GENERATED"),
          t.Literal("INVOICE_PAID"),
          t.Literal("VEHICLE_ASSIGNED"),
          t.Literal("DRIVER_INVITED"),
          t.Literal("PLAN_LIMIT_WARNING"),
          t.Literal("PAYMENT_FAILED"),
          t.Literal("SYSTEM"),
        ],
        { additionalProperties: false },
      ),
    ),
    title: t.Optional(t.String()),
    body: t.Optional(t.String()),
    data: t.Optional(__nullable__(t.Any())),
    read: t.Optional(t.Boolean()),
    readAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const NotificationRelationsInputCreate = t.Object(
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

export const NotificationRelationsInputUpdate = t.Partial(
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

export const NotificationWhere = t.Partial(
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
          type: t.Union(
            [
              t.Literal("TRIP_STARTED"),
              t.Literal("TRIP_ENDED"),
              t.Literal("TRIP_FORCE_ENDED"),
              t.Literal("INVOICE_GENERATED"),
              t.Literal("INVOICE_PAID"),
              t.Literal("VEHICLE_ASSIGNED"),
              t.Literal("DRIVER_INVITED"),
              t.Literal("PLAN_LIMIT_WARNING"),
              t.Literal("PAYMENT_FAILED"),
              t.Literal("SYSTEM"),
            ],
            { additionalProperties: false },
          ),
          title: t.String(),
          body: t.String(),
          data: t.Any(),
          read: t.Boolean(),
          readAt: t.Date(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "Notification" },
  ),
);

export const NotificationWhereUnique = t.Recursive(
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
              type: t.Union(
                [
                  t.Literal("TRIP_STARTED"),
                  t.Literal("TRIP_ENDED"),
                  t.Literal("TRIP_FORCE_ENDED"),
                  t.Literal("INVOICE_GENERATED"),
                  t.Literal("INVOICE_PAID"),
                  t.Literal("VEHICLE_ASSIGNED"),
                  t.Literal("DRIVER_INVITED"),
                  t.Literal("PLAN_LIMIT_WARNING"),
                  t.Literal("PAYMENT_FAILED"),
                  t.Literal("SYSTEM"),
                ],
                { additionalProperties: false },
              ),
              title: t.String(),
              body: t.String(),
              data: t.Any(),
              read: t.Boolean(),
              readAt: t.Date(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Notification" },
);

export const NotificationSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      userId: t.Boolean(),
      user: t.Boolean(),
      type: t.Boolean(),
      title: t.Boolean(),
      body: t.Boolean(),
      data: t.Boolean(),
      read: t.Boolean(),
      readAt: t.Boolean(),
      createdAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const NotificationInclude = t.Partial(
  t.Object(
    {
      tenant: t.Boolean(),
      user: t.Boolean(),
      type: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const NotificationOrderBy = t.Partial(
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
      title: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      body: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      data: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      read: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      readAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Notification = t.Composite(
  [NotificationPlain, NotificationRelations],
  { additionalProperties: false },
);

export const NotificationInputCreate = t.Composite(
  [NotificationPlainInputCreate, NotificationRelationsInputCreate],
  { additionalProperties: false },
);

export const NotificationInputUpdate = t.Composite(
  [NotificationPlainInputUpdate, NotificationRelationsInputUpdate],
  { additionalProperties: false },
);
