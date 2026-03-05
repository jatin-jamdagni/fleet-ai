import { useEffect } from "react";
import { fleetWS } from "../lib/ws";
import { useFleetStore } from "../store/fleet.store";
import { useAuthStore } from "../store/auth.store";

export function useFleetWS() {
  const token      = useAuthStore((s) => s.accessToken);
  const setVehicle = useFleetStore((s) => s.setVehicle);
  const removeVehicle = useFleetStore((s) => s.removeVehicle);
  const setConnected  = useFleetStore((s) => s.setConnected);

  useEffect(() => {
    if (!token) return;

    fleetWS.connect(token);

    const off = fleetWS.on((msg) => {
      switch (msg.type) {
        case "CONNECTED":
          setConnected(true);
          break;
        case "VEHICLE_UPDATE":
          setVehicle(msg.payload);
          break;
        case "TRIP_STARTED":
          setVehicle({
            vehicleId:    msg.payload.vehicleId,
            lat:          0,
            lng:          0,
            speed:        0,
            heading:      0,
            driverName:   msg.payload.driverName,
            licensePlate: msg.payload.licensePlate,
            timestamp:    msg.payload.timestamp,
          });
          break;
        case "TRIP_ENDED":
          removeVehicle(msg.payload.vehicleId);
          break;
      }
    });

    return () => {
      off();
      fleetWS.disconnect();
      setConnected(false);
    };
  }, [token]);
}