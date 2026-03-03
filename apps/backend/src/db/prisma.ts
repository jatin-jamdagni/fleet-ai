import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { getTenantId } from "../lib/async-context";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const basePrisma = new PrismaClient({ adapter });

const TENANT_SCOPED_MODELS = new Set([
  "vehicle",
  "trip",
  "invoice",
  "manualchunk",
  "ailog",
  "auditlog",
]);

const READ_OPERATIONS = new Set([
  "findFirst",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

const WHERE_SCOPED_WRITE_OPERATIONS = new Set([
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

function addTenantWhere(args: any, tenantId: string) {
  const nextArgs = args ?? {};
  nextArgs.where = {
    ...(nextArgs.where ?? {}),
    tenantId,
  };
  return nextArgs;
}

export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const modelName = String(model ?? "").toLowerCase();
        if (!modelName || !TENANT_SCOPED_MODELS.has(modelName)) {
          return query(args);
        }

        // No tenant context (seed scripts, cron jobs, health checks): pass through.
        let tenantId: string | null = null;
        try {
          tenantId = getTenantId();
        } catch {
          return query(args);
        }

        if (!tenantId) {
          return query(args);
        }

        let nextArgs = (args ?? {}) as Record<string, any>;

        if (READ_OPERATIONS.has(operation)) {
          nextArgs = addTenantWhere(nextArgs, tenantId);
        }

        if (operation === "create") {
          nextArgs.data = {
            ...(nextArgs.data ?? {}),
            tenantId,
          };
        }

        if (operation === "createMany") {
          if (Array.isArray(nextArgs.data)) {
            nextArgs.data = nextArgs.data.map((item: any) => ({ ...item, tenantId }));
          } else {
            nextArgs.data = {
              ...(nextArgs.data ?? {}),
              tenantId,
            };
          }
        }

        if (operation === "upsert") {
          nextArgs = addTenantWhere(nextArgs, tenantId);
          nextArgs.create = {
            ...(nextArgs.create ?? {}),
            tenantId,
          };
          nextArgs.update = {
            ...(nextArgs.update ?? {}),
            tenantId,
          };
        }

        if (WHERE_SCOPED_WRITE_OPERATIONS.has(operation)) {
          nextArgs = addTenantWhere(nextArgs, tenantId);
        }

        return query(nextArgs as any);
      },
    },
  },
});
