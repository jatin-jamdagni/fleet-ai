import { useEffect, useRef, useCallback } from "react";
import * as Location from "expo-location";
import { driverWS } from "../lib/ws";
import { useTripStore } from "../store/trip.store";

const GPS_INTERVAL_MS = 3000; // 3 seconds

export function useGPS() {
  const activeTrip    = useTripStore((s) => s.activeTrip);
  const setTracking   = useTripStore((s) => s.setTracking);
  const updatePing    = useTripStore((s) => s.updatePing);
  const incrementPing = useTripStore((s) => s.incrementPing);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef      = useRef<Location.LocationSubscription | null>(null);
  const latestPos     = useRef<{ lat: number; lng: number; speed: number; heading: number } | null>(null);

  const startTracking = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("[GPS] Permission denied");
      return false;
    }

    // Watch position — updates latestPos ref continuously
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy:         Location.Accuracy.BestForNavigation,
        distanceInterval: 5,    // every 5 meters
        timeInterval:     1000, // at least every 1s
      },
      (loc) => {
        latestPos.current = {
          lat:     loc.coords.latitude,
          lng:     loc.coords.longitude,
          speed:   Math.max(0, (loc.coords.speed ?? 0) * 3.6), // m/s → km/h
          heading: loc.coords.heading ?? 0,
        };
        if (activeTrip) {
          updatePing(
            loc.coords.latitude,
            loc.coords.longitude,
            latestPos.current.speed
          );
        }
      }
    );

    // Send ping every 3 seconds
    intervalRef.current = setInterval(() => {
      if (!latestPos.current || !activeTrip) return;

      driverWS.sendGpsPing({
        tripId:    activeTrip.id,
        lat:       latestPos.current.lat,
        lng:       latestPos.current.lng,
        speed:     latestPos.current.speed,
        heading:   latestPos.current.heading,
        timestamp: new Date().toISOString(),
      });

      incrementPing();
    }, GPS_INTERVAL_MS);

    setTracking(true);
    return true;
  }, [activeTrip?.id]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    watchRef.current?.remove();
    watchRef.current = null;
    setTracking(false);
    latestPos.current = null;
  }, []);

  // Start/stop based on active trip
  useEffect(() => {
    if (activeTrip && driverWS.registered) {
      startTracking();
    } else {
      stopTracking();
    }
    return stopTracking;
  }, [activeTrip?.id, driverWS.registered]);

  return { startTracking, stopTracking, latestPos };
}