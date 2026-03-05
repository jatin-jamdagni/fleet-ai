import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fleetWS } from "../lib/ws";
import { gpsApi } from "../lib/api";

export interface LiveMapPosition {
  vehicleId: string;
  tripId: string;
  driverId: string;
  driverName: string;
  licensePlate: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  timestamp: string;
}

export function useLiveMap() {
  const [liveUpdates, setLiveUpdates] = useState<Map<string, LiveMapPosition>>(new Map());

  const { data = [] } = useQuery<LiveMapPosition[]>({
    queryKey: ["gps-live-positions"],
    queryFn: async () => {
      const res = await gpsApi.live();
      return res.data.data;
    },
    retry: false,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const off = fleetWS.on((msg) => {
      if (msg.type === "VEHICLE_UPDATE") {
        const p = msg.payload;
        setLiveUpdates((prev) => {
          const next = new Map(prev);
          const prevItem = next.get(p.vehicleId);
          next.set(p.vehicleId, {
            vehicleId: p.vehicleId,
            tripId: prevItem?.tripId ?? "",
            driverId: prevItem?.driverId ?? "",
            driverName: p.driverName,
            licensePlate: p.licensePlate,
            lat: p.lat,
            lng: p.lng,
            speed: p.speed,
            heading: p.heading,
            timestamp: p.timestamp,
          });
          return next;
        });
      }

      if (msg.type === "TRIP_ENDED") {
        setLiveUpdates((prev) => {
          const next = new Map(prev);
          next.delete(msg.payload.vehicleId);
          return next;
        });
      }
    });

    return off;
  }, []);

  const positionsMap = useMemo(() => {
    const merged = new Map<string, LiveMapPosition>();
    for (const item of data) merged.set(item.vehicleId, item);
    for (const [vehicleId, item] of liveUpdates) merged.set(vehicleId, item);
    return merged;
  }, [data, liveUpdates]);

  const list = useMemo(() => Array.from(positionsMap.values()), [positionsMap]);
  return {
    positions: list,
    positionsMap,
    activeCount: list.length,
  };
}
