import { t } from "elysia";

import { __transformDate__ } from "./__transformDate__";

import { __nullable__ } from "./__nullable__";

export const VehiclePlain = t.Object(
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
  },
  { additionalProperties: false },
);

export const VehicleRelations = t.Object(
  {
    tenant: t.Object(
      {
        id: t.String(),
        name: t.String(),
        slug: t.String(),
        plan: t.Union(
          [
            t.Literal("STARTER"),
            t.Literal("PROFESSIONAL"),
            t.Literal("ENTERPRISE"),
          ],
          { additionalProperties: false },
        ),
        createdAt: t.Date(),
        updatedAt: t.Date(),
        deletedAt: __nullable__(t.Date()),
      },
      { additionalProperties: false },
    ),
    assignedDriver: __nullable__(
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
        },
        { additionalProperties: false },
      ),
    ),
    trips: t.Array(
      t.Object(
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
      { additionalProperties: false },
    ),
    manualChunks: t.Array(
      t.Object(
        {
          id: t.String(),
          vehicleId: t.String(),
          tenantId: t.String(),
          content: t.String(),
          chunkIndex: t.Integer(),
          pageNumber: __nullable__(t.Integer()),
          createdAt: t.Date(),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
    invoices: t.Array(
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
          paidAt: __nullable__(t.Date()),
        },
        { additionalProperties: false },
      ),
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const VehiclePlainInputCreate = t.Object(
  {
    licensePlate: t.String(),
    make: t.String(),
    model: t.String(),
    year: t.Integer(),
    costPerKm: t.Number(),
    status: t.Optional(
      t.Union(
        [t.Literal("ACTIVE"), t.Literal("INACTIVE"), t.Literal("IN_TRIP")],
        { additionalProperties: false },
      ),
    ),
    hasManual: t.Optional(t.Boolean()),
    deletedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const VehiclePlainInputUpdate = t.Object(
  {
    licensePlate: t.Optional(t.String()),
    make: t.Optional(t.String()),
    model: t.Optional(t.String()),
    year: t.Optional(t.Integer()),
    costPerKm: t.Optional(t.Number()),
    status: t.Optional(
      t.Union(
        [t.Literal("ACTIVE"), t.Literal("INACTIVE"), t.Literal("IN_TRIP")],
        { additionalProperties: false },
      ),
    ),
    hasManual: t.Optional(t.Boolean()),
    deletedAt: t.Optional(__nullable__(t.Date())),
  },
  { additionalProperties: false },
);

export const VehicleRelationsInputCreate = t.Object(
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
    assignedDriver: t.Optional(
      t.Object(
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
    ),
    trips: t.Optional(
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
    manualChunks: t.Optional(
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
    invoices: t.Optional(
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

export const VehicleRelationsInputUpdate = t.Partial(
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
      assignedDriver: t.Partial(
        t.Object(
          {
            connect: t.Object(
              {
                id: t.String({ additionalProperties: false }),
              },
              { additionalProperties: false },
            ),
            disconnect: t.Boolean(),
          },
          { additionalProperties: false },
        ),
      ),
      trips: t.Partial(
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
      manualChunks: t.Partial(
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
      invoices: t.Partial(
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

export const VehicleWhere = t.Partial(
  t.Recursive(
    (Self) =>
      t.Object(
        {
          AND: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          NOT: t.Union([Self, t.Array(Self, { additionalProperties: false })]),
          OR: t.Array(Self, { additionalProperties: false }),
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
          assignedDriverId: t.String(),
          hasManual: t.Boolean(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
          deletedAt: t.Date(),
        },
        { additionalProperties: false },
      ),
    { $id: "Vehicle" },
  ),
);

export const VehicleWhereUnique = t.Recursive(
  (Self) =>
    t.Intersect(
      [
        t.Partial(
          t.Object(
            { id: t.String(), assignedDriverId: t.String() },
            { additionalProperties: false },
          ),
          { additionalProperties: false },
        ),
        t.Union(
          [
            t.Object({ id: t.String() }),
            t.Object({ assignedDriverId: t.String() }),
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
              licensePlate: t.String(),
              make: t.String(),
              model: t.String(),
              year: t.Integer(),
              costPerKm: t.Number(),
              status: t.Union(
                [
                  t.Literal("ACTIVE"),
                  t.Literal("INACTIVE"),
                  t.Literal("IN_TRIP"),
                ],
                { additionalProperties: false },
              ),
              assignedDriverId: t.String(),
              hasManual: t.Boolean(),
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
  { $id: "Vehicle" },
);

export const VehicleSelect = t.Partial(
  t.Object(
    {
      id: t.Boolean(),
      tenantId: t.Boolean(),
      licensePlate: t.Boolean(),
      make: t.Boolean(),
      model: t.Boolean(),
      year: t.Boolean(),
      costPerKm: t.Boolean(),
      status: t.Boolean(),
      assignedDriverId: t.Boolean(),
      hasManual: t.Boolean(),
      createdAt: t.Boolean(),
      updatedAt: t.Boolean(),
      deletedAt: t.Boolean(),
      tenant: t.Boolean(),
      assignedDriver: t.Boolean(),
      trips: t.Boolean(),
      manualChunks: t.Boolean(),
      invoices: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const VehicleInclude = t.Partial(
  t.Object(
    {
      status: t.Boolean(),
      tenant: t.Boolean(),
      assignedDriver: t.Boolean(),
      trips: t.Boolean(),
      manualChunks: t.Boolean(),
      invoices: t.Boolean(),
      _count: t.Boolean(),
    },
    { additionalProperties: false },
  ),
);

export const VehicleOrderBy = t.Partial(
  t.Object(
    {
      id: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      tenantId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      licensePlate: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      make: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      model: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      year: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      costPerKm: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      assignedDriverId: t.Union([t.Literal("asc"), t.Literal("desc")], {
        additionalProperties: false,
      }),
      hasManual: t.Union([t.Literal("asc"), t.Literal("desc")], {
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

export const Vehicle = t.Composite([VehiclePlain, VehicleRelations], {
  additionalProperties: false,
});

export const VehicleInputCreate = t.Composite(
  [VehiclePlainInputCreate, VehicleRelationsInputCreate],
  { additionalProperties: false },
);

export const VehicleInputUpdate = t.Composite(
  [VehiclePlainInputUpdate, VehicleRelationsInputUpdate],
  { additionalProperties: false },
);
