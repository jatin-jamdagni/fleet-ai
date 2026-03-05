import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const WebhookEndpointPlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    name: t.String(),
    url: t.String(),
    secret: t.String(),
    events: t.Array(t.String(), { additionalProperties: false }),
    active: t.Boolean(),
    createdById: t.String(),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const WebhookEndpointRelations = t.Object(
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
    createdBy: t.Object(
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
    deliveries: t.Array(
      t.Object(
        {
          id: t.String(),
          endpointId: t.String(),
          event: t.String(),
          payload: t.Any(),
          status: t.Integer(),
          responseBody: __nullable__(t.String()),
          durationMs: __nullable__(t.Integer()),
          attempt: t.Integer(),
          deliveredAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const WebhookEndpointPlainInputCreate = t.Object(
  {
    name: t.String(),
    url: t.String(),
    secret: t.String(),
    events: t.Array(t.String(), { additionalProperties: false }),
    active: t.Optional(t.Boolean()),
  },
  { additionalProperties: false },
);

export const WebhookEndpointPlainInputUpdate = t.Object(
  {
    name: t.Optional(t.String()),
    url: t.Optional(t.String()),
    secret: t.Optional(t.String()),
    events: t.Optional(t.Array(t.String(), { additionalProperties: false })),
    active: t.Optional(t.Boolean()),
  },
  { additionalProperties: false },
);

export const WebhookEndpointRelationsInputCreate = t.Object(
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
    createdBy: t.Object(
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
    deliveries: t.Optional(
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

export const WebhookEndpointRelationsInputUpdate = t.Partial(
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
      createdBy: t.Object(
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
      deliveries: t.Partial(
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

export const WebhookEndpointWhere = t.Partial(
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
          url: t.String(),
          secret: t.String(),
          events: t.Array(t.String(), { additionalProperties: false }),
          active: t.Boolean(),
          createdById: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "WebhookEndpoint" },
  ),
);

export const WebhookEndpointWhereUnique = t.Recursive(
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
              url: t.String(),
              secret: t.String(),
              events: t.Array(t.String(), { additionalProperties: false }),
              active: t.Boolean(),
              createdById: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "WebhookEndpoint" },
);

export const WebhookEndpointSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      name: t.Boolean(),
      url: t.Boolean(),
      secret: t.Boolean(),
      events: t.Boolean(),
      active: t.Boolean(),
      createdById: t.Boolean(),
      createdBy: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      deliveries: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const WebhookEndpointInclude = t.Partial(
  t.Object(
    {
      tenant: t.Boolean(),
      createdBy: t.Boolean(),
      deliveries: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const WebhookEndpointOrderBy = t.Partial(
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
      url: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      secret: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      events: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      active: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdById: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const WebhookEndpoint = t.Composite(
  [WebhookEndpointPlain, WebhookEndpointRelations],
  { additionalProperties: false },
);

export const WebhookEndpointInputCreate = t.Composite(
  [WebhookEndpointPlainInputCreate, WebhookEndpointRelationsInputCreate],
  { additionalProperties: false },
);

export const WebhookEndpointInputUpdate = t.Composite(
  [WebhookEndpointPlainInputUpdate, WebhookEndpointRelationsInputUpdate],
  { additionalProperties: false },
);
