import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const InvoicePlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    tripId: t.String(),
    vehicleId: t.String(),
    driverId: t.String(),
    distanceKm: t.Number(),
    costPerKm: t.Number(),
    totalAmount: t.Number(),
    currency: t.String(),
    status: t.Union(
      [t.Literal("PENDING"), t.Literal("PAID"), t.Literal("VOID")],
      { additionalProperties: false },
    ),
    generatedAt: t.Date(),
    paidAt: __nullable__(t.Date()),
    subtotal: t.Number(),
    taxAmount: t.Number(),
    taxLabel: t.String(),
    taxRate: t.Number(),
    lineItems: __nullable__(t.Any()),
  },
  { additionalProperties: false },
);

export const InvoiceRelations = t.Object(
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

export const InvoicePlainInputCreate = t.Object(
  {
    distanceKm: t.Number(),
    costPerKm: t.Number(),
    totalAmount: t.Number(),
    currency: t.Optional(t.String()),
    status: t.Optional(
      t.Union([t.Literal("PENDING"), t.Literal("PAID"), t.Literal("VOID")], {
        additionalProperties: false,
      }),
    ),
    generatedAt: t.Optional(t.Date()),
    paidAt: t.Optional(__nullable__(t.Date())),
    subtotal: t.Optional(t.Number()),
    taxAmount: t.Optional(t.Number()),
    taxLabel: t.Optional(t.String()),
    taxRate: t.Optional(t.Number()),
    lineItems: t.Optional(__nullable__(t.Any())),
  },
  { additionalProperties: false },
);

export const InvoicePlainInputUpdate = t.Object(
  {
    distanceKm: t.Optional(t.Number()),
    costPerKm: t.Optional(t.Number()),
    totalAmount: t.Optional(t.Number()),
    currency: t.Optional(t.String()),
    status: t.Optional(
      t.Union([t.Literal("PENDING"), t.Literal("PAID"), t.Literal("VOID")], {
        additionalProperties: false,
      }),
    ),
    generatedAt: t.Optional(t.Date()),
    paidAt: t.Optional(__nullable__(t.Date())),
    subtotal: t.Optional(t.Number()),
    taxAmount: t.Optional(t.Number()),
    taxLabel: t.Optional(t.String()),
    taxRate: t.Optional(t.Number()),
    lineItems: t.Optional(__nullable__(t.Any())),
  },
  { additionalProperties: false },
);

export const InvoiceRelationsInputCreate = t.Object(
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

export const InvoiceRelationsInputUpdate = t.Partial(
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

export const InvoiceWhere = t.Partial(
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
          distanceKm: t.Number(),
          costPerKm: t.Number(),
          totalAmount: t.Number(),
          currency: t.String(),
          status: t.Union(
            [t.Literal("PENDING"), t.Literal("PAID"), t.Literal("VOID")],
            { additionalProperties: false },
          ),
          generatedAt: t.Date(),
          paidAt: t.Date(),
          subtotal: t.Number(),
          taxAmount: t.Number(),
          taxLabel: t.String(),
          taxRate: t.Number(),
          lineItems: t.Any(),
        },
        { additionalProperties: false },
      ),
    { $id: "Invoice" },
  ),
);

export const InvoiceWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String(), tripId: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [t.Object({ id: t.String() }), t.Object({ tripId: t.String() })],
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
              tripId: t.String(),
              vehicleId: t.String(),
              driverId: t.String(),
              distanceKm: t.Number(),
              costPerKm: t.Number(),
              totalAmount: t.Number(),
              currency: t.String(),
              status: t.Union(
                [t.Literal("PENDING"), t.Literal("PAID"), t.Literal("VOID")],
                { additionalProperties: false },
              ),
              generatedAt: t.Date(),
              paidAt: t.Date(),
              subtotal: t.Number(),
              taxAmount: t.Number(),
              taxLabel: t.String(),
              taxRate: t.Number(),
              lineItems: t.Any(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "Invoice" },
);

export const InvoiceSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tripId: t.Boolean(),
      vehicleId: t.Boolean(),
      driverId: t.Boolean(),
      distanceKm: t.Boolean(),
      costPerKm: t.Boolean(),
      totalAmount: t.Boolean(),
      currency: t.Boolean(),
      status: t.Boolean(),
      generatedAt: t.Boolean(),
      paidAt: t.Boolean(),
      subtotal: t.Boolean(),
      taxAmount: t.Boolean(),
      taxLabel: t.Boolean(),
      taxRate: t.Boolean(),
      lineItems: t.Boolean(),
      tenant: t.Boolean(),
      trip: t.Boolean(),
      vehicle: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const InvoiceInclude = t.Partial(
  t.Object(
    {
      status: t.Boolean(),
      tenant: t.Boolean(),
      trip: t.Boolean(),
      vehicle: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const InvoiceOrderBy = t.Partial(
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
      distanceKm: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      costPerKm: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      totalAmount: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      currency: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      generatedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      paidAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      subtotal: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      taxAmount: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      taxLabel: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      taxRate: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lineItems: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const Invoice = t.Composite([InvoicePlain, InvoiceRelations], {
  additionalProperties: false,
});

export const InvoiceInputCreate = t.Composite(
  [InvoicePlainInputCreate, InvoiceRelationsInputCreate],
  { additionalProperties: false },
);

export const InvoiceInputUpdate = t.Composite(
  [InvoicePlainInputUpdate, InvoiceRelationsInputUpdate],
  { additionalProperties: false },
);
