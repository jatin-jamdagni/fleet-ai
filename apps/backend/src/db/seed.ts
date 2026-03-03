import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, Plan } from "../generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-logistics" },
    update: {},
    create: {
      name: "Demo Logistics Co.",
      slug: "demo-logistics",
      plan: Plan.PROFESSIONAL,
    },
  });
  console.log(`✅ Tenant: ${tenant.name}`);

  // Create fleet manager
  const managerPassword = await Bun.password.hash("Manager123!", {
    algorithm: "bcrypt",
    cost: 12,
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@demo.fleet" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "manager@demo.fleet",
      passwordHash: managerPassword,
      name: "Demo Manager",
      role: Role.FLEET_MANAGER,
    },
  });
  console.log(`✅ Fleet Manager: ${manager.email}`);

  // Create driver
  const driverPassword = await Bun.password.hash("Driver123!", {
    algorithm: "bcrypt",
    cost: 12,
  });

  const driver = await prisma.user.upsert({
    where: { email: "driver@demo.fleet" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "driver@demo.fleet",
      passwordHash: driverPassword,
      name: "Demo Driver",
      role: Role.DRIVER,
    },
  });
  console.log(`✅ Driver: ${driver.email}`);

  // Create demo vehicle
  const vehicle = await prisma.vehicle.upsert({
    where: {
      id: "demo-vehicle-001",
    },
    update: {},
    create: {
      id: "demo-vehicle-001",
      tenantId: tenant.id,
      licensePlate: "TRK-001",
      make: "Mercedes-Benz",
      model: "Actros",
      year: 2023,
      costPerKm: 2.5,
      assignedDriverId: driver.id,
    },
  });
  console.log(`✅ Vehicle: ${vehicle.licensePlate} (${vehicle.make} ${vehicle.model})`);

  console.log(`
🎉 Seed complete!

  Login credentials:
  ─────────────────────────────────────
  Fleet Manager → manager@demo.fleet / Manager123!
  Driver        → driver@demo.fleet  / Driver123!
  ─────────────────────────────────────
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
