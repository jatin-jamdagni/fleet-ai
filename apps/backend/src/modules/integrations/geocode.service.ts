import { prisma } from "../../db/prisma";

const GOOGLE_MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface GeoResult {
  address: string;
  city:    string | null;
  country: string | null;
}

// ─── Reverse geocode with cache ───────────────────────────────────────────────

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeoResult | null> {
  // Round to 4 decimal places (~11m precision) for cache hit rate
  const rLat = Math.round(lat * 10000) / 10000;
  const rLng = Math.round(lng * 10000) / 10000;

  // Check cache first
  const cached = await prisma.geocodeCache.findFirst({
    where: { lat: rLat, lng: rLng },
  });

  if (cached) {
    return {
      address: cached.address,
      city:    cached.city,
      country: cached.country,
    };
  }

  if (!GOOGLE_MAPS_KEY) {
    console.log("[Geocode] No GOOGLE_MAPS_API_KEY — skipping");
    return null;
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("key",    GOOGLE_MAPS_KEY);
    url.searchParams.set("result_type", "street_address|locality");

    const res  = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) {
      return null;
    }

    const result  = data.results[0];
    const address = result.formatted_address;

    const getComponent = (type: string) =>
      result.address_components?.find(
        (c: any) => c.types.includes(type)
      )?.long_name ?? null;

    const city    = getComponent("locality") ?? getComponent("administrative_area_level_2");
    const country = getComponent("country");

    // Cache result
    await prisma.geocodeCache.upsert({
      where:  { lat_lng: { lat: rLat, lng: rLng } },
      create: { lat: rLat, lng: rLng, address, city, country },
      update: { address, city, country },
    }).catch(() => {});

    return { address, city, country };

  } catch (err) {
    console.error("[Geocode] Failed:", err);
    return null;
  }
}

// ─── Batch geocode for a trip (start + end points) ───────────────────────────

export async function geocodeTrip(
  tripId: string
): Promise<{ startAddress: string | null; endAddress: string | null }> {
  const pings = await prisma.$queryRaw<Array<{
    lat:         number;
    lng:         number;
    recorded_at: Date;
  }>>`
    SELECT
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      recorded_at
    FROM gps_pings
    WHERE trip_id = ${tripId}
    ORDER BY recorded_at ASC
    LIMIT 1
  `;

  const lastPing = await prisma.$queryRaw<Array<{
    lat:         number;
    lng:         number;
  }>>`
    SELECT
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng
    FROM gps_pings
    WHERE trip_id = ${tripId}
    ORDER BY recorded_at DESC
    LIMIT 1
  `;

  const [startGeo, endGeo] = await Promise.all([
    pings[0]    ? reverseGeocode(pings[0].lat,    pings[0].lng)    : null,
    lastPing[0] ? reverseGeocode(lastPing[0].lat, lastPing[0].lng) : null,
  ]);

  return {
    startAddress: startGeo?.address ?? null,
    endAddress:   endGeo?.address   ?? null,
  };
}