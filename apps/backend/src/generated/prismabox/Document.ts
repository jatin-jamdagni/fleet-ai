import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const DocumentPlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    entityType: t.String(),
    entityId: t.String(),
    docType: t.String(),
    label: t.String(),
    expiresAt: __nullable__(t.Date()),
    fileUrl: __nullable__(t.String()),
    notifiedAt: __nullable__(t.Date()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const DocumentRelations = t.Object(
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
    vehicles: t.Array(
      t.Object(
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
      { additionalProperties: false },
    ),
    users: t.Array(
      t.Object(
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
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const DocumentPlainInputCreate = t.Object(
  {
    entityType: t.String(),
    docType: t.String(),
    label: t.String(),
    expiresAt: t.Optional(__nullable__(t.Date())),
    fileUrl: t.Optional(__nullable__(t.String())),
    notifiedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const DocumentPlainInputUpdate = t.Object(
  {
    entityType: t.Optional(t.String()),
    docType: t.Optional(t.String()),
    label: t.Optional(t.String()),
    expiresAt: t.Optional(__nullable__(t.Date())),
    fileUrl: t.Optional(__nullable__(t.String())),
    notifiedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const DocumentRelationsInputCreate = t.Object(
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
    vehicles: t.Optional(
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
    users: t.Optional(
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

export const DocumentRelationsInputUpdate = t.Partial(
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
      vehicles: t.Partial(
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
      users: t.Partial(
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

export const DocumentWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          tenantId: t.String(),
          entityType: t.String(),
          entityId: t.String(),
          docType: t.String(),
          label: t.String(),
          expiresAt: t.Date(),
          fileUrl: t.String(),
          notifiedAt: t.Date(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "Document" },
  ),
);

export const DocumentWhereUnique = t.Recursive(
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
              entityType: t.String(),
              entityId: t.String(),
              docType: t.String(),
              label: t.String(),
              expiresAt: t.Date(),
              fileUrl: t.String(),
              notifiedAt: t.Date(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Document" },
);

export const DocumentSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      entityType: t.Boolean(),
      entityId: t.Boolean(),
      docType: t.Boolean(),
      label: t.Boolean(),
      expiresAt: t.Boolean(),
      fileUrl: t.Boolean(),
      notifiedAt: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      vehicles: t.Boolean(),
      users: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const DocumentInclude = t.Partial(
  t.Object(
    {
      tenant: t.Boolean(),
      vehicles: t.Boolean(),
      users: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const DocumentOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      entityType: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      entityId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      docType: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      label: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      expiresAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      fileUrl: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      notifiedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const Document = t.Composite([DocumentPlain, DocumentRelations], {
  additionalProperties: false,
});

export const DocumentInputCreate = t.Composite(
  [DocumentPlainInputCreate, DocumentRelationsInputCreate],
  { additionalProperties: false },
);

export const DocumentInputUpdate = t.Composite(
  [DocumentPlainInputUpdate, DocumentRelationsInputUpdate],
  { additionalProperties: false },
);
