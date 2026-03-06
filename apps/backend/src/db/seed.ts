// ═══════════════════════════════════════════════════════════════════════════════
//  FLEET AI — India Demo Seed
//  Realistic data for: Delhi NCR logistics company with inter-city routes
//
//  Run: bun run src/db/seed.ts
//  Requires: DATA_MODE=demo in .env
//
//  Creates:
//    • 1 Tenant   — Bharat Logistics Pvt. Ltd. (Delhi)
//    • 1 Manager  — manager@bharatlogistics.in
//    • 8 Drivers  — driver1@bharatlogistics.in … driver8@…
//    • 12 Vehicles — mix of Tata, Mahindra, Ashok Leyland, Eicher
//    • ~60 Trips  — real Indian highway corridors with GPS traces
//    • ~4000 GPS pings — realistic speed/heading patterns
//    • ~60 Invoices — INR amounts, mix of PAID / PENDING / VOID
//    • 8 AI Logs — realistic Hindi-English driver questions
//    • 1 ACTIVE trip — for live demo on dashboard
// ═══════════════════════════════════════════════════════════════════════════════

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, Plan, VehicleStatus, TripStatus, InvoiceStatus } from "../generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const DATA_MODE = process.env.DATA_MODE ?? "live";
if (DATA_MODE !== "demo") {
  console.log("DATA_MODE is not 'demo' — skipping seed. Set DATA_MODE=demo to run.");
  process.exit(0);
}

// ══════════════════════════════════════════════════════════════════════════════
//  INDIA-SPECIFIC CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

// Indian license plates: {STATE} {DISTRICT} {SERIES} {NUMBER}
// Format used by real logistics fleets
const PLATES = [
  "DL 01 CA 7842", // Delhi
  "DL 03 CG 1194", // Delhi
  "MH 12 AB 5637", // Pune, Maharashtra
  "MH 43 BK 9021", // Thane, Maharashtra
  "RJ 14 GB 3388", // Jaipur, Rajasthan
  "UP 80 CT 4456", // Agra, Uttar Pradesh
  "HR 26 AE 8810", // Gurugram, Haryana
  "HR 55 BM 2231", // Faridabad, Haryana
  "GJ 01 ZX 6673", // Ahmedabad, Gujarat
  "PB 10 CD 5509", // Ludhiana, Punjab
  "KA 01 MF 7712", // Bengaluru, Karnataka
  "TN 09 BQ 3341", // Chennai, Tamil Nadu
];

// Indian commercial vehicle makes and models (real trucks/vans used in logistics)
const VEHICLES = [
  { make: "Tata Motors",    model: "Prima 4928.S",    year: 2023, type: "Heavy Truck"   },
  { make: "Tata Motors",    model: "Signa 4823.TK",   year: 2022, type: "Heavy Truck"   },
  { make: "Ashok Leyland",  model: "AVTR 4220 IL",    year: 2023, type: "Heavy Truck"   },
  { make: "Ashok Leyland",  model: "Ecomet 1615 CNG", year: 2022, type: "Medium Truck"  },
  { make: "Mahindra",       model: "Blazo X 55",      year: 2023, type: "Heavy Truck"   },
  { make: "Mahindra",       model: "Furio 17",         year: 2021, type: "Medium Truck"  },
  { make: "Eicher",         model: "Pro 3015",         year: 2022, type: "Light Truck"   },
  { make: "Eicher",         model: "Pro 6041",         year: 2023, type: "Medium Truck"  },
  { make: "Tata Motors",    model: "Ace Gold",         year: 2023, type: "Mini Truck"    },
  { make: "Force Motors",   model: "Traveller 40",     year: 2022, type: "Delivery Van"  },
  { make: "Mahindra",       model: "Supro Profit Truck",year: 2021,type: "Mini Truck"    },
  { make: "Bajaj",          model: "Maxima Cargo",     year: 2023, type: "3-Wheeler"     },
];

// Cost per km in INR (realistic rates for different vehicle types)
const COST_PER_KM: Record<string, number> = {
  "Heavy Truck":    42.50,
  "Medium Truck":   28.75,
  "Light Truck":    18.00,
  "Mini Truck":     12.50,
  "Delivery Van":   15.00,
  "3-Wheeler":       8.50,
};

// Indian male and female names (mix of North + South Indian, common in logistics)
const DRIVER_NAMES = [
  { name: "Ramesh Kumar Yadav",      email: "driver1@bharatlogistics.in" },
  { name: "Suresh Singh Rawat",      email: "driver2@bharatlogistics.in" },
  { name: "Mohammad Aslam Khan",     email: "driver3@bharatlogistics.in" },
  { name: "Rajendra Prasad Sharma",  email: "driver4@bharatlogistics.in" },
  { name: "Santosh Babu Patel",      email: "driver5@bharatlogistics.in" },
  { name: "Deepak Narayan Gupta",    email: "driver6@bharatlogistics.in" },
  { name: "Murugan Arumugam",        email: "driver7@bharatlogistics.in" },
  { name: "Bhavesh Dinesh Solanki",  email: "driver8@bharatlogistics.in" },
];

// Real Indian highway corridors with accurate GPS coordinates
// Format: { name, waypoints: [{lat, lng, city}] }
const ROUTES = [
  {
    name: "Delhi → Jaipur (NH-48)",
    waypoints: [
      { lat: 28.5562, lng: 77.0999, city: "Gurugram Toll" },
      { lat: 28.3167, lng: 76.9167, city: "Rewari" },
      { lat: 27.8974, lng: 76.6065, city: "Alwar" },
      { lat: 27.5530, lng: 76.6346, city: "Shahpura" },
      { lat: 26.9124, lng: 75.7873, city: "Jaipur" },
    ],
    distanceKm: 270,
    avgSpeedKmh: 65,
    typicalStopCities: ["Rewari", "Alwar"],
  },
  {
    name: "Delhi → Agra (Yamuna Expressway)",
    waypoints: [
      { lat: 28.4089, lng: 77.3178, city: "Noida" },
      { lat: 28.1986, lng: 77.4921, city: "Greater Noida" },
      { lat: 27.8974, lng: 77.7167, city: "Mathura Junction" },
      { lat: 27.1767, lng: 78.0081, city: "Agra" },
    ],
    distanceKm: 202,
    avgSpeedKmh: 80,
    typicalStopCities: ["Mathura"],
  },
  {
    name: "Delhi → Chandigarh (NH-44)",
    waypoints: [
      { lat: 28.8386, lng: 77.2064, city: "Sonipat" },
      { lat: 29.2183, lng: 76.9862, city: "Panipat" },
      { lat: 29.4699, lng: 77.0231, city: "Karnal" },
      { lat: 29.9695, lng: 76.8783, city: "Ambala" },
      { lat: 30.7333, lng: 76.7794, city: "Chandigarh" },
    ],
    distanceKm: 244,
    avgSpeedKmh: 70,
    typicalStopCities: ["Panipat", "Karnal"],
  },
  {
    name: "Delhi → Meerut (NH-58)",
    waypoints: [
      { lat: 28.7041, lng: 77.2090, city: "Delhi Kashmiri Gate" },
      { lat: 28.7295, lng: 77.3848, city: "Ghaziabad" },
      { lat: 28.7785, lng: 77.5479, city: "Masuri" },
      { lat: 28.9845, lng: 77.7064, city: "Meerut" },
    ],
    distanceKm: 72,
    avgSpeedKmh: 55,
    typicalStopCities: ["Ghaziabad"],
  },
  {
    name: "Gurugram → Faridabad (Urban)",
    waypoints: [
      { lat: 28.4595, lng: 77.0266, city: "Gurugram Cyber City" },
      { lat: 28.4743, lng: 77.1010, city: "NH-48 Crossing" },
      { lat: 28.4089, lng: 77.1759, city: "Badarpur" },
      { lat: 28.4089, lng: 77.3178, city: "Faridabad" },
    ],
    distanceKm: 32,
    avgSpeedKmh: 35,
    typicalStopCities: ["Badarpur"],
  },
  {
    name: "Delhi → Panipat (NH-44 Short)",
    waypoints: [
      { lat: 28.7041, lng: 77.2090, city: "Delhi ISBT" },
      { lat: 28.8386, lng: 77.2064, city: "Sonipat" },
      { lat: 29.2183, lng: 76.9862, city: "Panipat" },
    ],
    distanceKm: 90,
    avgSpeedKmh: 68,
    typicalStopCities: ["Sonipat"],
  },
  {
    name: "Jaipur → Ajmer (NH-48)",
    waypoints: [
      { lat: 26.9124, lng: 75.7873, city: "Jaipur" },
      { lat: 26.6781, lng: 75.5090, city: "Dudu" },
      { lat: 26.4499, lng: 74.6399, city: "Ajmer" },
    ],
    distanceKm: 131,
    avgSpeedKmh: 60,
    typicalStopCities: ["Dudu"],
  },
  {
    name: "Delhi Ring Road (Inner)",
    waypoints: [
      { lat: 28.7041, lng: 77.2090, city: "Kashmiri Gate" },
      { lat: 28.6862, lng: 77.2280, city: "Shastri Park" },
      { lat: 28.6139, lng: 77.2090, city: "ITO" },
      { lat: 28.5672, lng: 77.2100, city: "Lajpat Nagar" },
      { lat: 28.5245, lng: 77.2066, city: "Kalkaji" },
      { lat: 28.5013, lng: 77.0924, city: "Dwarka" },
    ],
    distanceKm: 48,
    avgSpeedKmh: 28,
    typicalStopCities: ["ITO", "Lajpat Nagar"],
  },
];

// Realistic AI assistant questions Indian drivers actually ask
const AI_QUESTIONS = [
  {
    question: "Engine ka overheating ho raha hai, kya karna chahiye?",
    answer: "Engine overheat hone par turant vehicle rok len aur engine band kar den. Coolant level check karen — agar kam ho to wait karen engine thanda hone ka (minimum 30 min), phir coolant add karen. Radiator cap kabhi garam engine pe na kholen — pressure se burn ho sakta hai. Agar coolant theek hai aur phir bhi overheat ho raha hai to nearest workshop le jayen. Daily startup se pehle coolant level zaroor check karen.",
    latencyMs: 1842,
  },
  {
    question: "Tyre pressure kitna hona chahiye Tata Prima mein?",
    answer: "Tata Prima 4928.S ke liye: Front tyres 100–110 PSI (7.0–7.5 bar), Rear tyres (single) 110–120 PSI (7.5–8.3 bar), Rear tyres (dual) 100–110 PSI each. Load ke hisaab se pressure adjust hota hai — full load pe upar wali range use karen. Har din subah chalane se pehle ek baar check zaroor karen, specially NH highways pe. TPMS warning light aaye to turant check karen.",
    latencyMs: 2156,
  },
  {
    question: "DPF warning light kya matlab hai aur kaise reset karen?",
    answer: "DPF (Diesel Particulate Filter) warning light ka matlab filter mein carbon jam ho gayi hai. Isko clear karne ke liye: highway pe 60–80 km/h par 20–30 min tak chalte raho (passive regeneration). Agar light band na ho to: engine on rakhen, neutral mein, 15–20 min idle rehne den (active regeneration — fan bahut tej chalega, normal hai). Agar phir bhi band na ho to workshop le jayen. Roz city mein short trips mat karen — highway pe ek baar lamba safar karte raho.",
    latencyMs: 1978,
  },
  {
    question: "Brake fail ho jaye to kya karna chahiye highway pe?",
    answer: "Brake fail hone par: (1) Turant engine brake use karen — lower gear mein shift karen (if manual); (2) Handbrake/parking brake dheere dheere pull karen — ek jhaTke mein nahi; (3) Road divider ya sand/gravel areaJi ke taraf jaye to vehicle rok saken; (4) Horn bajayen aur hazard lights on karen; (5) Agar koi option nahi to controlled crash better hai than major accident. NH pe brake fail hona bahut rare hai — har din brake pedal travel check karen, spongy feel aaye to turant service le.",
    latencyMs: 2341,
  },
  {
    question: "AdBlue kab dalna chahiye aur kahan milega?",
    answer: "AdBlue (DEF - Diesel Exhaust Fluid) dashboard par dedicated gauge se check karen. Warning light aane se pehle hi refill kar len — agar tank empty ho jaye to BS6 trucks mein engine derate ho jaata hai aur phir band ho sakta hai. Refill kahan: HPCL/BPCL/Indian Oil ke major highway dhaba pumps pe milta hai, Tata authorized service centers pe, aur online bhi order kar sakte hain. 10L se 100L ke packs milte hain. Quality check karen — sirf ISO 22241 certified AdBlue hi use karen.",
    latencyMs: 1654,
  },
  {
    question: "Gearbox me gear shift karte waqt grinding aawaz aa rahi hai",
    answer: "Grinding aawaz gear shift mein synchronizer wear ki nishani hai — Ashok Leyland AVTR mein yeh common hai agar clutch poora nahi dabaya jaata. Fix: (1) Clutch completely press karen before shifting — half clutch avoid karen; (2) RPM match karen before downshift — double declutching try karen; (3) Agar Gear 2nd-3rd ke beech zyada grinding ho to synchronizer check karwana padega. Temporary fix: Neutral mein 0.5 second rook ke phir gear dalen. Workshop jayein agar yeh 2-3 din se zyada ho raha hai — synchronizer ignore karne se full gearbox damage ho sakta hai.",
    latencyMs: 2089,
  },
  {
    question: "Highway pe raat ko kya safety checks lene chahiye?",
    answer: "Raat ke safar se pehle: (1) Headlights — dono high aur low beam; (2) Parking lights aur rear reflectors — trucks ke liye mandatory; (3) Side markers — ladai trucks ke liye; (4) Wiper blades working hain; (5) Horn working; (6) Fuel full karo — raat ko pump band ho sakte hain; (7) AdBlue check; (8) Tyre pressure; (9) Mobile charging full karo; (10) Fleet manager ko departure time aur ETA batao. NH-48 aur NH-44 pe raat 2-4 baje ke beech zyada accidents hote hain — agar neend aa rahi ho to dhaba pe rook ke so jaao, 1-2 ghante ki neend better hai.",
    latencyMs: 1923,
  },
  {
    question: "Mahindra Blazo ka oil change interval kya hai?",
    answer: "Mahindra Blazo X 55 ke liye: Engine oil — 30,000 km ya 6 months (jo pehle aaye), BS6 engine ke liye SAE 15W-40 CI-4+ ya CH-4 grade oil use karen. Gear oil (gearbox) — 60,000 km. Differential oil — 60,000 km. Coolant — 2 saal ya 100,000 km. Air filter — 10,000 km (dusty roads pe 5,000 km). Fuel filter — 20,000 km. NH-48 pe sand aur dust zyada hota hai toh air filter interval kam kar lo. Har oil change ka record rakho — warranty ke liye zaroori hai.",
    latencyMs: 1765,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
function mustGet<T>(arr: readonly T[], index: number, label: string): T {
  const value = arr[index];
  if (value === undefined) {
    throw new Error(`Expected ${label} at index ${index}`);
  }
  return value;
}

const pick = <T>(arr: readonly T[], label: string): T => {
  if (arr.length === 0) {
    throw new Error(`Cannot pick from empty array: ${label}`);
  }
  return mustGet(arr, Math.floor(Math.random() * arr.length), label);
};

function getCostPerKm(vehicleType: string): number {
  const value = COST_PER_KM[vehicleType];
  if (value === undefined) {
    throw new Error(`Unknown vehicle type for costPerKm: ${vehicleType}`);
  }
  return value;
}

function daysAgo(n: number, hourOffset = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hourOffset + randInt(0, 3), randInt(0, 59), 0, 0);
  return d;
}

// Generate GPS pings along a route (interpolated waypoints with noise)
function generateGpsPings(
  waypoints: { lat: number; lng: number; city: string }[],
  startTime: Date,
  avgSpeedKmh: number,
  pingIntervalSec = 15
): { lat: number; lng: number; speed: number; heading: number; timestamp: Date }[] {
  const pings: { lat: number; lng: number; speed: number; heading: number; timestamp: Date }[] = [];
  let currentTime = new Date(startTime.getTime());

  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = mustGet(waypoints, i, "route waypoint");
    const to = mustGet(waypoints, i + 1, "route waypoint");

    // Calculate distance between waypoints (Haversine approx)
    const dlat = to.lat - from.lat;
    const dlng = to.lng - from.lng;
    const segDistKm = Math.sqrt(dlat * dlat + dlng * dlng) * 111.0;

    // Number of pings for this segment
    const segTimeSec = (segDistKm / avgSpeedKmh) * 3600;
    const numPings = Math.max(3, Math.floor(segTimeSec / pingIntervalSec));

    // Bearing from A to B
    const bearing = Math.atan2(dlng, dlat) * (180 / Math.PI);
    const headingBase = (bearing + 360) % 360;

    for (let p = 0; p < numPings; p++) {
      const t = p / numPings;
      const lat = from.lat + dlat * t + (Math.random() - 0.5) * 0.0008;
      const lng = from.lng + dlng * t + (Math.random() - 0.5) * 0.0008;

      // Realistic speed variations
      let speed = avgSpeedKmh;
      if (p < 5) speed = avgSpeedKmh * 0.5;               // acceleration
      else if (p > numPings - 5) speed = avgSpeedKmh * 0.6; // deceleration
      else speed = avgSpeedKmh * rand(0.7, 1.15);           // normal variation

      // Occasional slowdowns (dhaba stop, toll, traffic)
      if (Math.random() < 0.05) speed = rand(5, 15);        // slow/stopped

      pings.push({
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        speed: parseFloat(speed.toFixed(1)),
        heading: parseFloat(((headingBase + rand(-8, 8)) % 360).toFixed(1)),
        timestamp: new Date(currentTime.getTime()),
      });

      currentTime = new Date(currentTime.getTime() + pingIntervalSec * 1000);
    }
  }

  return pings;
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN SEED
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("");
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║   Fleet AI — India Demo Seed (Bharat Logistics)     ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log("");

  // ── Guard: already seeded? ───────────────────────────────────────────────
  const existing = await prisma.tenant.findFirst({
    where: { slug: "bharat-logistics" },
  });
  if (existing) {
    console.log("⚠  Tenant 'bharat-logistics' already exists — skipping seed.");
    console.log("   Delete the tenant and re-run to reseed.");
    process.exit(0);
  }

  // ── 1. TENANT ─────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.create({
    data: {
      name:     "Bharat Logistics Pvt. Ltd.",
      slug:     "bharat-logistics",
      plan:     Plan.PROFESSIONAL,
      countryCode: "IN",
      currency: "INR",
      fleetType: "logistics",
      operatingRegions: ["domestic"],
      cargoTypes: ["general", "fragile", "automotive"],
      requiresPOD: true,
      requiresWaybill: true,
    },
  });
  console.log(`✓ Tenant:   ${tenant.name} (${tenant.slug})`);

  // ── 2. FLEET MANAGER ──────────────────────────────────────────────────────
  const managerPw = "Manager@123";
  const managerPwHash = await Bun.password.hash(managerPw, {
    algorithm: "bcrypt",
    cost: 10,
  });
  const manager   = await prisma.user.create({
    data: {
      tenantId:     tenant.id,
      email:        "manager@bharatlogistics.in",
      passwordHash: managerPwHash,
      name:         "Vikram Anand Srivastava",
      role:         Role.FLEET_MANAGER,
    },
  });
  console.log(`✓ Manager:  ${manager.email}  /  ${managerPw}`);

  // ── 3. DRIVERS ────────────────────────────────────────────────────────────
  const driverPw = "Driver@123";
  const driverPwHash = await Bun.password.hash(driverPw, {
    algorithm: "bcrypt",
    cost: 10,
  });
  const drivers  = await Promise.all(
    DRIVER_NAMES.map((d) =>
      prisma.user.create({
        data: {
          tenantId:     tenant.id,
          email:        d.email,
          passwordHash: driverPwHash,
          name:         d.name,
          role:         Role.DRIVER,
        },
      })
    )
  );
  console.log(`✓ Drivers:  ${drivers.length} created  (driver1@bharatlogistics.in … /  ${driverPw})`);

  // ── 4. VEHICLES ───────────────────────────────────────────────────────────
  const vehicles = await Promise.all(
    VEHICLES.map((v, i) =>
      prisma.vehicle.create({
        data: {
          tenantId:         tenant.id,
          licensePlate:     mustGet(PLATES, i, "license plate"),
          make:             v.make,
          model:            v.model,
          year:             v.year,
          costPerKm:        getCostPerKm(v.type),
          status:           VehicleStatus.ACTIVE,
          // Assign first 8 vehicles to drivers, last 4 unassigned (maintenance pool)
          assignedDriverId: i < 8 ? mustGet(drivers, i % drivers.length, "assigned driver").id : null,
        },
      })
    )
  );
  console.log(`✓ Vehicles: ${vehicles.length} created`);
  console.log("");
  console.log("  Generating trips and GPS routes (this takes ~15s)…");
  console.log("");

  // ── 5. TRIPS + GPS PINGS + INVOICES ──────────────────────────────────────
  let totalTrips    = 0;
  let totalPings    = 0;
  let totalInvoices = 0;

  // Each assigned vehicle gets 4–7 historical trips spread over last 60 days
  for (const vehicle of vehicles.slice(0, 10)) {
    const fallbackDriver = mustGet(drivers, 0, "fallback driver");
    const driver = vehicle.assignedDriverId
      ? drivers.find((d) => d.id === vehicle.assignedDriverId) ?? fallbackDriver
      : fallbackDriver;
    const tripCount = randInt(4, 7);

    for (let t = 0; t < tripCount; t++) {
      const route     = pick(ROUTES, "routes");
      const startTime = daysAgo(randInt(2, 58), randInt(4, 16));

      // Simulate GPS route
      const pings    = generateGpsPings(route.waypoints, startTime, route.avgSpeedKmh);
      const endTime  = mustGet(pings, pings.length - 1, "trip gps ping").timestamp;

      // Calculate realistic distance from pings
      const distanceKm = parseFloat((route.distanceKm * rand(0.92, 1.05)).toFixed(3));
      const costPerKmDecimal = Number(vehicle.costPerKm);
      const totalAmount = parseFloat((distanceKm * costPerKmDecimal).toFixed(2));

      // Invoice status distribution: 70% paid, 20% pending, 10% void
      const statusRoll = Math.random();
      const invStatus  = statusRoll < 0.70 ? InvoiceStatus.PAID
                       : statusRoll < 0.90 ? InvoiceStatus.PENDING
                       : InvoiceStatus.VOID;

      // Create trip
      const trip = await prisma.trip.create({
        data: {
          tenantId:   tenant.id,
          vehicleId:  vehicle.id,
          driverId:   driver.id,
          status:     TripStatus.COMPLETED,
          startTime,
          endTime,
          distanceKm,
        },
      });

      // Batch insert GPS pings
      await prisma.gpsPing.createMany({
        data: pings.map((p) => ({
          tripId:    trip.id,
          lat:       p.lat,
          lng:       p.lng,
          speed:     p.speed,
          heading:   p.heading,
          timestamp: p.timestamp,
        })),
        skipDuplicates: true,
      });

      // Create invoice
      const paidAt = invStatus === InvoiceStatus.PAID
        ? new Date(endTime.getTime() + rand(1, 72) * 3_600_000)
        : null;

      await prisma.invoice.create({
        data: {
          tenantId:   tenant.id,
          tripId:     trip.id,
          vehicleId:  vehicle.id,
          driverId:   driver.id,
          distanceKm,
          costPerKm:  costPerKmDecimal,
          totalAmount,
          currency:   "INR",
          status:     invStatus,
          generatedAt: endTime,
          paidAt,
        },
      });

      totalTrips++;
      totalPings    += pings.length;
      totalInvoices++;
    }
  }

  console.log(`  ✓ Trips:    ${totalTrips}`);
  console.log(`  ✓ GPS pings: ${totalPings}`);
  console.log(`  ✓ Invoices: ${totalInvoices}`);

  // ── 6. ACTIVE TRIP (live demo) ────────────────────────────────────────────
  const liveVehicle = mustGet(vehicles, 0, "live vehicle"); // DL 01 CA 7842 — Tata Prima
  const liveDriver  = mustGet(drivers, 0, "live driver"); // Ramesh Kumar Yadav
  const liveRoute   = mustGet(ROUTES, 0, "live route"); // Delhi → Jaipur (NH-48)

  const liveStartTime = new Date(Date.now() - 45 * 60 * 1000); // started 45 min ago

  const liveTrip = await prisma.trip.create({
    data: {
      tenantId:  tenant.id,
      vehicleId: liveVehicle.id,
      driverId:  liveDriver.id,
      status:    TripStatus.ACTIVE,
      startTime: liveStartTime,
    },
  });

  // Insert partial pings (first ~2 waypoints only — mid-journey)
  const livePings = generateGpsPings(
    liveRoute.waypoints.slice(0, 3),
    liveStartTime,
    liveRoute.avgSpeedKmh,
    15
  );
  await prisma.gpsPing.createMany({
    data: livePings.map((p) => ({
      tripId:    liveTrip.id,
      lat:       p.lat,
      lng:       p.lng,
      speed:     p.speed,
      heading:   p.heading,
      timestamp: p.timestamp,
    })),
    skipDuplicates: true,
  });

  // Update vehicle to IN_TRIP
  await prisma.vehicle.update({
    where: { id: liveVehicle.id },
    data:  { status: VehicleStatus.IN_TRIP },
  });

  console.log(`  ✓ Active trip: ${liveVehicle.licensePlate} (${liveVehicle.make} ${liveVehicle.model})`);
  console.log(`               Driver: ${liveDriver.name}`);
  console.log(`               Route: ${liveRoute.name}`);
  console.log(`               En route with ${livePings.length} pings logged`);

  // ── 7. AI LOGS ────────────────────────────────────────────────────────────
  for (const [i, q] of AI_QUESTIONS.entries()) {
    const aiDriver = mustGet(drivers, i % drivers.length, "AI log driver");
    const aiVehicle= mustGet(vehicles, i % vehicles.length, "AI log vehicle");

    await prisma.aILog.create({
      data: {
        tenantId:  tenant.id,
        driverId:  aiDriver.id,
        vehicleId: aiVehicle.id,
        question:  q.question,
        retrievedChunks: [
          { chunkIndex: i * 3,     content: `${aiVehicle.make} ${aiVehicle.model} — Maintenance Section ${i + 1}` },
          { chunkIndex: i * 3 + 1, content: `Technical specification relevant to: ${q.question.slice(0, 60)}` },
        ],
        answer:    q.answer,
        latencyMs: q.latencyMs,
        createdAt: daysAgo(randInt(0, 7), randInt(6, 22)),
      },
    });
  }
  console.log(`  ✓ AI logs:  ${AI_QUESTIONS.length} entries`);

  // ── 8. SUMMARY ────────────────────────────────────────────────────────────
  // Compute some stats for display
  const paidInvoices = await prisma.invoice.aggregate({
    where:  { tenantId: tenant.id, status: InvoiceStatus.PAID },
    _sum:   { totalAmount: true },
    _count: { id: true },
  });
  const pendingCount = await prisma.invoice.count({
    where: { tenantId: tenant.id, status: InvoiceStatus.PENDING },
  });

  const totalRevenue = Number(paidInvoices._sum.totalAmount ?? 0);

  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║                  🎉  Seed Complete!                         ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  TENANT:   Bharat Logistics Pvt. Ltd. (Delhi NCR)           ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  LOGIN CREDENTIALS                                           ║");
  console.log("║  ─────────────────────────────────────────────────────────  ║");
  console.log("║  Fleet Manager                                               ║");
  console.log("║    Email:    manager@bharatlogistics.in                      ║");
  console.log("║    Password: Manager@123                                     ║");
  console.log("║                                                              ║");
  console.log("║  Drivers (driver1 … driver8)                                ║");
  console.log("║    Email:    driver1@bharatlogistics.in                      ║");
  console.log("║    Password: Driver@123                                      ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  DATABASE SUMMARY                                            ║");
  console.log(`║    Vehicles:  12  (Tata, Mahindra, Ashok Leyland, Eicher)   ║`);
  console.log(`║    Drivers:   8   (Hindi + South Indian names)              ║`);
  console.log(`║    Trips:     ${String(totalTrips).padEnd(3)} completed + 1 ACTIVE (live demo)     ║`);
  console.log(`║    GPS pings: ${String(totalPings).padEnd(5)} (~${livePings.length} live pings on active trip) ║`);
  console.log(`║    Invoices:  ${String(paidInvoices._count.id).padEnd(2)} PAID / ${String(pendingCount).padEnd(2)} PENDING                     ║`);
  console.log(`║    Revenue:   ₹${totalRevenue.toLocaleString("en-IN").padEnd(12)} (PAID invoices)         ║`);
  console.log("║    Currency:  INR ₹                                          ║");
  console.log("║    AI Logs:   8 (Hindi-English bilingual queries)            ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  LIVE DEMO                                                   ║");
  console.log("║    Active vehicle:  DL 01 CA 7842 (Tata Prima 4928.S)       ║");
  console.log("║    Active driver:   Ramesh Kumar Yadav                       ║");
  console.log("║    Route:           Delhi → Jaipur (NH-48)                  ║");
  console.log("║    Status:          En route near Rewari / Alwar             ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  ROUTES COVERED                                              ║");
  ROUTES.slice(0, 5).forEach((r) => {
    console.log(`║    • ${r.name.padEnd(47)}  ║`);
  });
  console.log("║    • ...and 3 more routes                                   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");
}

main()
  .catch((e) => {
    console.error("✗ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
