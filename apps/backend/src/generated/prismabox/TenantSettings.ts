import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const TenantSettingsPlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    companyName: __nullable__(t.String()),
    logoUrl: __nullable__(t.String()),
    primaryColor: t.String(),
    accentColor: t.String(),
    customDomain: __nullable__(t.String()),
    timezone: t.String(),
    currency: t.String(),
    distanceUnit: t.String(),
    invoicePrefix: t.String(),
    invoiceFooter: __nullable__(t.String()),
    vatNumber: __nullable__(t.String()),
    address: __nullable__(t.String()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const TenantSettingsRelations = t.Object(
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
  },
  { additionalProperties: false },
);

export const TenantSettingsPlainInputCreate = t.Object(
  {
    companyName: t.Optional(__nullable__(t.String())),
    logoUrl: t.Optional(__nullable__(t.String())),
    primaryColor: t.Optional(t.String()),
    accentColor: t.Optional(t.String()),
    customDomain: t.Optional(__nullable__(t.String())),
    timezone: t.Optional(t.String()),
    currency: t.Optional(t.String()),
    distanceUnit: t.Optional(t.String()),
    invoicePrefix: t.Optional(t.String()),
    invoiceFooter: t.Optional(__nullable__(t.String())),
    vatNumber: t.Optional(__nullable__(t.String())),
    address: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const TenantSettingsPlainInputUpdate = t.Object(
  {
    companyName: t.Optional(__nullable__(t.String())),
    logoUrl: t.Optional(__nullable__(t.String())),
    primaryColor: t.Optional(t.String()),
    accentColor: t.Optional(t.String()),
    customDomain: t.Optional(__nullable__(t.String())),
    timezone: t.Optional(t.String()),
    currency: t.Optional(t.String()),
    distanceUnit: t.Optional(t.String()),
    invoicePrefix: t.Optional(t.String()),
    invoiceFooter: t.Optional(__nullable__(t.String())),
    vatNumber: t.Optional(__nullable__(t.String())),
    address: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const TenantSettingsRelationsInputCreate = t.Object(
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
  },
  { additionalProperties: false },
);

export const TenantSettingsRelationsInputUpdate = t.Partial(
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
    },
    { additionalProperties: false },
  ),
);

export const TenantSettingsWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          tenantId: t.String(),
          companyName: t.String(),
          logoUrl: t.String(),
          primaryColor: t.String(),
          accentColor: t.String(),
          customDomain: t.String(),
          timezone: t.String(),
          currency: t.String(),
          distanceUnit: t.String(),
          invoicePrefix: t.String(),
          invoiceFooter: t.String(),
          vatNumber: t.String(),
          address: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "TenantSettings" },
  ),
);

export const TenantSettingsWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String(), tenantId: t.String(), customDomain: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [
            t.Object({ id: t.String() }),
            t.Object({ tenantId: t.String() }),
            t.Object({ customDomain: t.String() }),
          ],
          { additionalProperties: false },
        ),
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
              companyName: t.String(),
              logoUrl: t.String(),
              primaryColor: t.String(),
              accentColor: t.String(),
              customDomain: t.String(),
              timezone: t.String(),
              currency: t.String(),
              distanceUnit: t.String(),
              invoicePrefix: t.String(),
              invoiceFooter: t.String(),
              vatNumber: t.String(),
              address: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "TenantSettings" },
);

export const TenantSettingsSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tenant: t.Boolean(),
      companyName: t.Boolean(),
      logoUrl: t.Boolean(),
      primaryColor: t.Boolean(),
      accentColor: t.Boolean(),
      customDomain: t.Boolean(),
      timezone: t.Boolean(),
      currency: t.Boolean(),
      distanceUnit: t.Boolean(),
      invoicePrefix: t.Boolean(),
      invoiceFooter: t.Boolean(),
      vatNumber: t.Boolean(),
      address: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const TenantSettingsInclude = t.Partial(
  t.Object(
    { tenant: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const TenantSettingsOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      companyName: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      logoUrl: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      primaryColor: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      accentColor: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      customDomain: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      timezone: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      currency: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      distanceUnit: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      invoicePrefix: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      invoiceFooter: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      vatNumber: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      address: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const TenantSettings = t.Composite(
  [TenantSettingsPlain, TenantSettingsRelations],
  { additionalProperties: false },
);

export const TenantSettingsInputCreate = t.Composite(
  [TenantSettingsPlainInputCreate, TenantSettingsRelationsInputCreate],
  { additionalProperties: false },
);

export const TenantSettingsInputUpdate = t.Composite(
  [TenantSettingsPlainInputUpdate, TenantSettingsRelationsInputUpdate],
  { additionalProperties: false },
);
