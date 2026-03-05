import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const WebhookDeliveryPlain = t.Object(
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
);

export const WebhookDeliveryRelations = t.Object(
  {
    endpoint: t.Object(
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
  },
  { additionalProperties: false },
);

export const WebhookDeliveryPlainInputCreate = t.Object(
  {
    event: t.String(),
    payload: t.Any(),
    status: t.Integer(),
    responseBody: t.Optional(__nullable__(t.String())),
    durationMs: t.Optional(__nullable__(t.Integer())),
    attempt: t.Optional(t.Integer()),
    deliveredAt: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const WebhookDeliveryPlainInputUpdate = t.Object(
  {
    event: t.Optional(t.String()),
    payload: t.Optional(t.Any()),
    status: t.Optional(t.Integer()),
    responseBody: t.Optional(__nullable__(t.String())),
    durationMs: t.Optional(__nullable__(t.Integer())),
    attempt: t.Optional(t.Integer()),
    deliveredAt: t.Optional(t.Date()),
  },
  { additionalProperties: false },
);

export const WebhookDeliveryRelationsInputCreate = t.Object(
  {
    endpoint: t.Object(
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

export const WebhookDeliveryRelationsInputUpdate = t.Partial(
  t.Object(
    {
      endpoint: t.Object(
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

export const WebhookDeliveryWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          endpointId: t.String(),
          event: t.String(),
          payload: t.Any(),
          status: t.Integer(),
          responseBody: t.String(),
          durationMs: t.Integer(),
          attempt: t.Integer(),
          deliveredAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "WebhookDelivery" },
  ),
);

export const WebhookDeliveryWhereUnique = t.Recursive(
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
              endpointId: t.String(),
              event: t.String(),
              payload: t.Any(),
              status: t.Integer(),
              responseBody: t.String(),
              durationMs: t.Integer(),
              attempt: t.Integer(),
              deliveredAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "WebhookDelivery" },
);

export const WebhookDeliverySelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      endpointId: t.Boolean(),
      endpoint: t.Boolean(),
      event: t.Boolean(),
      payload: t.Boolean(),
      status: t.Boolean(),
      responseBody: t.Boolean(),
      durationMs: t.Boolean(),
      attempt: t.Boolean(),
      deliveredAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const WebhookDeliveryInclude = t.Partial(
  t.Object(
    { endpoint: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const WebhookDeliveryOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      endpointId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      event: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      payload: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      status: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      responseBody: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      durationMs: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      attempt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      deliveredAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const WebhookDelivery = t.Composite(
  [WebhookDeliveryPlain, WebhookDeliveryRelations],
  { additionalProperties: false },
);

export const WebhookDeliveryInputCreate = t.Composite(
  [WebhookDeliveryPlainInputCreate, WebhookDeliveryRelationsInputCreate],
  { additionalProperties: false },
);

export const WebhookDeliveryInputUpdate = t.Composite(
  [WebhookDeliveryPlainInputUpdate, WebhookDeliveryRelationsInputUpdate],
  { additionalProperties: false },
);
