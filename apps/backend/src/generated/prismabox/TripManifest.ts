import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const TripManifestPlain = t.Object(
  {
    id: t.String(),
    tenantId: t.String(),
    tripId: t.String(),
    cargoDescription: __nullable__(t.String()),
    cargoType: __nullable__(t.String()),
    weightKg: __nullable__(t.Number()),
    volumeM3: __nullable__(t.Number()),
    pallets: __nullable__(t.Integer()),
    temperatureMin: __nullable__(t.Number()),
    temperatureMax: __nullable__(t.Number()),
    bolNumber: __nullable__(t.String()),
    poNumber: __nullable__(t.String()),
    waybillNumber: __nullable__(t.String()),
    sealNumber: __nullable__(t.String()),
    receiverName: __nullable__(t.String()),
    receiverPhone: __nullable__(t.String()),
    receiverAddress: __nullable__(t.String()),
    deliveryNotes: __nullable__(t.String()),
    podSignedAt: __nullable__(t.Date()),
    podSignedBy: __nullable__(t.String()),
    podImageUrl: __nullable__(t.String()),
    customsDeclaration: __nullable__(t.String()),
    hsCode: __nullable__(t.String()),
    originCountry: __nullable__(t.String()),
    destinationCountry: __nullable__(t.String()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
  },
  { additionalProperties: false },
);

export const TripManifestRelations = t.Object(
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

export const TripManifestPlainInputCreate = t.Object(
  {
    cargoDescription: t.Optional(__nullable__(t.String())),
    cargoType: t.Optional(__nullable__(t.String())),
    weightKg: t.Optional(__nullable__(t.Number())),
    volumeM3: t.Optional(__nullable__(t.Number())),
    pallets: t.Optional(__nullable__(t.Integer())),
    temperatureMin: t.Optional(__nullable__(t.Number())),
    temperatureMax: t.Optional(__nullable__(t.Number())),
    bolNumber: t.Optional(__nullable__(t.String())),
    poNumber: t.Optional(__nullable__(t.String())),
    waybillNumber: t.Optional(__nullable__(t.String())),
    sealNumber: t.Optional(__nullable__(t.String())),
    receiverName: t.Optional(__nullable__(t.String())),
    receiverPhone: t.Optional(__nullable__(t.String())),
    receiverAddress: t.Optional(__nullable__(t.String())),
    deliveryNotes: t.Optional(__nullable__(t.String())),
    podSignedAt: t.Optional(__nullable__(t.Date())),
    podSignedBy: t.Optional(__nullable__(t.String())),
    podImageUrl: t.Optional(__nullable__(t.String())),
    customsDeclaration: t.Optional(__nullable__(t.String())),
    hsCode: t.Optional(__nullable__(t.String())),
    originCountry: t.Optional(__nullable__(t.String())),
    destinationCountry: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const TripManifestPlainInputUpdate = t.Object(
  {
    cargoDescription: t.Optional(__nullable__(t.String())),
    cargoType: t.Optional(__nullable__(t.String())),
    weightKg: t.Optional(__nullable__(t.Number())),
    volumeM3: t.Optional(__nullable__(t.Number())),
    pallets: t.Optional(__nullable__(t.Integer())),
    temperatureMin: t.Optional(__nullable__(t.Number())),
    temperatureMax: t.Optional(__nullable__(t.Number())),
    bolNumber: t.Optional(__nullable__(t.String())),
    poNumber: t.Optional(__nullable__(t.String())),
    waybillNumber: t.Optional(__nullable__(t.String())),
    sealNumber: t.Optional(__nullable__(t.String())),
    receiverName: t.Optional(__nullable__(t.String())),
    receiverPhone: t.Optional(__nullable__(t.String())),
    receiverAddress: t.Optional(__nullable__(t.String())),
    deliveryNotes: t.Optional(__nullable__(t.String())),
    podSignedAt: t.Optional(__nullable__(t.Date())),
    podSignedBy: t.Optional(__nullable__(t.String())),
    podImageUrl: t.Optional(__nullable__(t.String())),
    customsDeclaration: t.Optional(__nullable__(t.String())),
    hsCode: t.Optional(__nullable__(t.String())),
    originCountry: t.Optional(__nullable__(t.String())),
    destinationCountry: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const TripManifestRelationsInputCreate = t.Object(
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

export const TripManifestRelationsInputUpdate = t.Partial(
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

export const TripManifestWhere = t.Partial(
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
          cargoDescription: t.String(),
          cargoType: t.String(),
          weightKg: t.Number(),
          volumeM3: t.Number(),
          pallets: t.Integer(),
          temperatureMin: t.Number(),
          temperatureMax: t.Number(),
          bolNumber: t.String(),
          poNumber: t.String(),
          waybillNumber: t.String(),
          sealNumber: t.String(),
          receiverName: t.String(),
          receiverPhone: t.String(),
          receiverAddress: t.String(),
          deliveryNotes: t.String(),
          podSignedAt: t.Date(),
          podSignedBy: t.String(),
          podImageUrl: t.String(),
          customsDeclaration: t.String(),
          hsCode: t.String(),
          originCountry: t.String(),
          destinationCountry: t.String(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "TripManifest" },
  ),
);

export const TripManifestWhereUnique = t.Recursive(
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
              cargoDescription: t.String(),
              cargoType: t.String(),
              weightKg: t.Number(),
              volumeM3: t.Number(),
              pallets: t.Integer(),
              temperatureMin: t.Number(),
              temperatureMax: t.Number(),
              bolNumber: t.String(),
              poNumber: t.String(),
              waybillNumber: t.String(),
              sealNumber: t.String(),
              receiverName: t.String(),
              receiverPhone: t.String(),
              receiverAddress: t.String(),
              deliveryNotes: t.String(),
              podSignedAt: t.Date(),
              podSignedBy: t.String(),
              podImageUrl: t.String(),
              customsDeclaration: t.String(),
              hsCode: t.String(),
              originCountry: t.String(),
              destinationCountry: t.String(),
              createdAt: t.Date(),
              updatedAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "TripManifest" },
);

export const TripManifestSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      tripId: t.Boolean(),
      trip: t.Boolean(),
      cargoDescription: t.Boolean(),
      cargoType: t.Boolean(),
      weightKg: t.Boolean(),
      volumeM3: t.Boolean(),
      pallets: t.Boolean(),
      temperatureMin: t.Boolean(),
      temperatureMax: t.Boolean(),
      bolNumber: t.Boolean(),
      poNumber: t.Boolean(),
      waybillNumber: t.Boolean(),
      sealNumber: t.Boolean(),
      receiverName: t.Boolean(),
      receiverPhone: t.Boolean(),
      receiverAddress: t.Boolean(),
      deliveryNotes: t.Boolean(),
      podSignedAt: t.Boolean(),
      podSignedBy: t.Boolean(),
      podImageUrl: t.Boolean(),
      customsDeclaration: t.Boolean(),
      hsCode: t.Boolean(),
      originCountry: t.Boolean(),
      destinationCountry: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const TripManifestInclude = t.Partial(
  t.Object(
    { trip: t.Boolean(), _count: t.Boolean() },
    { additionalProperties: false },
  ),
);

export const TripManifestOrderBy = t.Partial(
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
      cargoDescription: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      cargoType: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      weightKg: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      volumeM3: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      pallets: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      temperatureMin: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      temperatureMax: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      bolNumber: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      poNumber: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      waybillNumber: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      sealNumber: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      receiverName: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      receiverPhone: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      receiverAddress: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      deliveryNotes: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      podSignedAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      podSignedBy: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      podImageUrl: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      customsDeclaration: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      hsCode: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      originCountry: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      destinationCountry: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const TripManifest = t.Composite(
  [TripManifestPlain, TripManifestRelations],
  { additionalProperties: false },
);

export const TripManifestInputCreate = t.Composite(
  [TripManifestPlainInputCreate, TripManifestRelationsInputCreate],
  { additionalProperties: false },
);

export const TripManifestInputUpdate = t.Composite(
  [TripManifestPlainInputUpdate, TripManifestRelationsInputUpdate],
  { additionalProperties: false },
);
