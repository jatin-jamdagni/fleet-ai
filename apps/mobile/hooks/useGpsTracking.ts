import { useGPS } from "./useGPS";
import { useTripStore } from "../store/trip.store";

export function useGpsTracking() {
  const { startTracking, stopTracking, latestPos } = useGPS();
  const activeTrip = useTripStore((s) => s.activeTrip);
  const isTracking = useTripStore((s) => s.isTracking);

  const p = latestPos.current;

  return {
    lat: p?.lat ?? null,
    lng: p?.lng ?? null,
    speed: p?.speed ?? null,
    heading: p?.heading ?? null,
    tripId: activeTrip?.id ?? null,
    enabled: Boolean(activeTrip),
    isTracking,
    startTracking,
    stopTracking,
  };
}
