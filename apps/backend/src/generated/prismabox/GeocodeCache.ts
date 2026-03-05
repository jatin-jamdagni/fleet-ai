import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const GeocodeCachePlain = t.Object(
  {
    id: t.String(),
    lat: t.Number(),
    lng: t.Number(),
    address: t.String(),
    city: __nullable__(t.String()),
    country: __nullable__(t.String()),
    createdAt: t.Date(),
  },
  { additionalProperties: false },
);

export const GeocodeCacheRelations = t.Object(
  {},
  { additionalProperties: false },
);

export const GeocodeCachePlainInputCreate = t.Object(
  {
    lat: t.Number(),
    lng: t.Number(),
    address: t.String(),
    city: t.Optional(__nullable__(t.String())),
    country: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const GeocodeCachePlainInputUpdate = t.Object(
  {
    lat: t.Optional(t.Number()),
    lng: t.Optional(t.Number()),
    address: t.Optional(t.String()),
    city: t.Optional(__nullable__(t.String())),
    country: t.Optional(__nullable__(t.String())),
  },
  { additionalProperties: false },
);

export const GeocodeCacheRelationsInputCreate = t.Object(
  {},
  { additionalProperties: false },
);

export const GeocodeCacheRelationsInputUpdate = t.Partial(
  t.Object({}, { additionalProperties: false }),
);

export const GeocodeCacheWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
          id: t.String(),
          lat: t.Number(),
          lng: t.Number(),
          address: t.String(),
          city: t.String(),
          country: t.String(),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "GeocodeCache" },
  ),
);

export const GeocodeCacheWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            {
              id: t.String(),
              lat_lng: t.Object(
                { lat: t.Number(), lng: t.Number() },
                { additionalProperties: false },
              ),
            },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [
            t.Object({ id: t.String() }),
            t.Object({
              lat_lng: t.Object(
                { lat: t.Number(), lng: t.Number() },
                { additionalProperties: false },
              ),
            }),
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
              lat: t.Number(),
              lng: t.Number(),
              address: t.String(),
              city: t.String(),
              country: t.String(),
              createdAt: t.Date(),
            },
            { additionalProperties: false },
          ),
        ),
      ],
      { additionalProperties: false },
    ),
  { $id: "GeocodeCache" },
);

export const GeocodeCacheSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      lat: t.Boolean(),
      lng: t.Boolean(),
      address: t.Boolean(),
      city: t.Boolean(),
      country: t.Boolean(),
      createdAt: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const GeocodeCacheInclude = t.Partial(
  t.Object({ _count: t.Boolean() }, { additionalProperties: false }),
);

export const GeocodeCacheOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lat: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      lng: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      address: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      city: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      country: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      createdAt: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
    },
    { additionalProperties: false },
  ),
);

export const GeocodeCache = t.Composite(
  [GeocodeCachePlain, GeocodeCacheRelations],
  { additionalProperties: false },
);

export const GeocodeCacheInputCreate = t.Composite(
  [GeocodeCachePlainInputCreate, GeocodeCacheRelationsInputCreate],
  { additionalProperties: false },
);

export const GeocodeCacheInputUpdate = t.Composite(
  [GeocodeCachePlainInputUpdate, GeocodeCacheRelationsInputUpdate],
  { additionalProperties: false },
);
