import { useEffect, useRef, useCallback, useState } from "react";
import * as Location from "expo-location";
import { driverWS } from "../lib/ws";
import { useTripStore } from "../store/trip.store";

const GPS_INTERVAL_MS = 3000; // 3 seconds

export function useGPS() {
  const activeTrip    = useTripStore((s) => s.activeTrip);
  const setTracking   = useTripStore((s) => s.setTracking);
  const updatePing    = useTripStore((s) => s.updatePing);
  const incrementPing = useTripStore((s) => s.incrementPing);
  const isTracking    = useTripStore((s) => s.isTracking);
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchRef      = useRef<Location.LocationSubscription | null>(null);
  const latestPos     = useRef<{ lat: number; lng: number; speed: number; heading: number } | null>(null);
  const [wsRegistered, setWsRegistered] = useState(driverWS.getState().registered);

  useEffect(() => {
    return driverWS.onState((state) => {
      setWsRegistered(state.registered);
    });
  }, []);

  const startTracking = useCallback(async () => {
    if (!activeTrip) return false;
    if (intervalRef.current || watchRef.current) {
      setTracking(true);
      return true;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("[GPS] Permission denied");
      setTracking(false);
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
        const currentTrip = useTripStore.getState().activeTrip;
        latestPos.current = {
          lat:     loc.coords.latitude,
          lng:     loc.coords.longitude,
          speed:   Math.max(0, (loc.coords.speed ?? 0) * 3.6), // m/s → km/h
          heading: loc.coords.heading ?? 0,
        };
        if (currentTrip) {
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
      const currentTrip = useTripStore.getState().activeTrip;
      if (!latestPos.current || !currentTrip) return;

      driverWS.sendGpsPing({
        tripId:    currentTrip.id,
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
  }, [activeTrip?.id, incrementPing, setTracking, updatePing]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    watchRef.current?.remove();
    watchRef.current = null;
    setTracking(false);
    latestPos.current = null;
  }, [setTracking]);

  // Keep websocket registration synced with active trip.
  useEffect(() => {
    if (!activeTrip) {
      stopTracking();
      return;
    }

    driverWS.register(activeTrip.id);
  }, [activeTrip?.id, stopTracking]);

  // Start tracking only after websocket REGISTERED ack is received.
  useEffect(() => {
    if (!activeTrip) {
      stopTracking();
      return;
    }

    if (wsRegistered) {
      void startTracking();
    } else if (isTracking) {
      stopTracking();
    }
  }, [activeTrip?.id, isTracking, startTracking, stopTracking, wsRegistered]);

  return { startTracking, stopTracking, latestPos };
}
