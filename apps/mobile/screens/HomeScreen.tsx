import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, RefreshControl,
  StatusBar, Alert, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tripsApi, vehiclesApi } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import { useTripStore } from "../store/trip.store";
import { driverWS } from "../lib/ws";
import { useGpsTracking } from "../hooks/useGpsTracking";
import { usePushNotifications } from "../hooks/usePushNotifications";
import {
  Btn, Card, Badge, SectionLabel, StatRow, Divider, C,
} from "../components/UI";
import { authApi } from "../lib/api";

export default function HomeScreen() {
  const qc         = useQueryClient();
  const user       = useAuthStore((s) => s.user);
  const clearAuth  = useAuthStore((s) => s.clearAuth);
  const activeTrip = useTripStore((s) => s.activeTrip);
  const setActive  = useTripStore((s) => s.setActiveTrip);
  const isTracking = useTripStore((s) => s.isTracking);

  useGpsTracking();
  usePushNotifications();

  // Connect WebSocket on mount
  useEffect(() => {
    driverWS.connect();

    const off = driverWS.on((msg) => {
      if (msg.type === "REGISTERED") {
        console.log("[WS] Registered for trip");
      }
    });

    return () => {
      off();
      driverWS.disconnect();
    };
  }, []);

  // Load my vehicle
  const { data: vehicleRes, isLoading: vehicleLoading, refetch } = useQuery({
    queryKey: ["my-vehicle"],
    queryFn:  () => vehiclesApi.myVehicle().then((r) => r.data),
    refetchInterval: 15_000,
  });

  // Load recent trips
  const { data: tripsRes } = useQuery({
    queryKey: ["my-trips"],
    queryFn:  () => tripsApi.myTrips({ pageSize: 5 }).then((r) => r.data),
    refetchInterval: activeTrip ? false : 30_000,
  });

  // Find my assigned vehicle
  const myVehicle = vehicleRes?.data ?? null;

  const startMut = useMutation({
    mutationFn: () => tripsApi.start(myVehicle!.id),
    onSuccess: (res) => {
      const trip = res.data.data;
      setActive({
        id:           trip.id,
        vehicleId:    trip.vehicleId,
        licensePlate: trip.vehicle.licensePlate,
        make:         trip.vehicle.make,
        model:        trip.vehicle.model,
        startTime:    trip.startTime,
        distanceKm:   0,
        pingCount:    0,
        lastLat:      null,
        lastLng:      null,
        speed:        0,
      });

      // Register WebSocket
      driverWS.register(trip.id);

      qc.invalidateQueries({ queryKey: ["my-trips"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.error?.message ?? "Failed to start trip");
    },
  });

  const endMut = useMutation({
    mutationFn: () => tripsApi.end(activeTrip!.id),
    onSuccess: () => {
      setActive(null);
      driverWS.disconnect();
      setTimeout(() => driverWS.connect(), 500);
      qc.invalidateQueries({ queryKey: ["my-trips"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.response?.data?.error?.message ?? "Failed to end trip");
    },
  });

  const handleEndTrip = () => {
    Alert.alert(
      "END TRIP",
      "Are you sure you want to end this trip?\nAn invoice will be generated automatically.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "End Trip", style: "destructive", onPress: () => endMut.mutate() },
      ]
    );
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    await clearAuth();
    driverWS.disconnect();
  };

  const trips = tripsRes?.data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={vehicleLoading}
            onRefresh={refetch}
            tintColor={C.amber}
          />
        }
      >
        {/* Header */}
        <View style={{
          flexDirection:   "row",
          justifyContent:  "space-between",
          alignItems:      "center",
          paddingHorizontal: 20,
          paddingTop:       16,
          paddingBottom:    16,
          borderBottomColor: C.border,
          borderBottomWidth: 1,
        }}>
          <View>
            <Text style={{
              color:         C.amber,
              fontSize:      11,
              fontWeight:    "700",
              letterSpacing: 3,
            }}>
              FLEET AI
            </Text>
            <Text style={{
              color:      C.text,
              fontSize:   18,
              fontWeight: "900",
              marginTop:  2,
            }}>
              {user?.name}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{
                width:           8,
                height:          8,
                borderRadius:    4,
                backgroundColor: driverWS.connected ? C.green : C.faint,
              }} />
              <Text style={{ color: C.muted, fontSize: 11, letterSpacing: 1 }}>
                {driverWS.connected ? "LIVE" : "OFFLINE"}
              </Text>
            </View>
            <TouchableOpacity onPress={handleLogout}>
              <Text style={{ color: C.faint, fontSize: 11, letterSpacing: 1 }}>
                LOGOUT →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Trip Banner */}
        {activeTrip && (
          <View style={{
            backgroundColor: C.amber + "15",
            borderBottomColor: C.amber + "30",
            borderBottomWidth: 1,
            paddingHorizontal: 20,
            paddingVertical:   12,
            flexDirection:     "row",
            alignItems:        "center",
            gap:               8,
          }}>
            <View style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: C.amber,
            }} />
            <Text style={{ color: C.amber, fontSize: 12, fontWeight: "700", letterSpacing: 2 }}>
              TRIP ACTIVE — {isTracking ? "GPS STREAMING" : "CONNECTING..."}
            </Text>
            {isTracking && (
              <Text style={{ color: C.amber, fontSize: 11, marginLeft: "auto" }}>
                {activeTrip.pingCount} PINGS
              </Text>
            )}
          </View>
        )}

        <View style={{ padding: 20, gap: 24 }}>

          {/* Vehicle Card */}
          <View>
            <SectionLabel>Assigned Vehicle</SectionLabel>
            {myVehicle ? (
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View>
                    <Text style={{
                      color:      C.amber,
                      fontSize:   28,
                      fontWeight: "900",
                      letterSpacing: -0.5,
                    }}>
                      {myVehicle.licensePlate}
                    </Text>
                    <Text style={{ color: C.text, fontSize: 16, fontWeight: "700", marginTop: 2 }}>
                      {myVehicle.make} {myVehicle.model}
                    </Text>
                    <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>
                      {myVehicle.year} · ${Number(myVehicle.costPerKm).toFixed(2)}/km
                    </Text>
                  </View>
                  <Badge color={
                    myVehicle.status === "ACTIVE"   ? "green" :
                    myVehicle.status === "IN_TRIP"  ? "amber" : "slate"
                  }>
                    {myVehicle.status}
                  </Badge>
                </View>

                {/* Active trip stats */}
                {activeTrip && (
                  <>
                    <Divider mt={14} mb={14} />
                    <StatRow label="Speed"    value={`${activeTrip.speed.toFixed(0)} km/h`} accent />
                    <StatRow label="Pings"    value={activeTrip.pingCount} />
                    <StatRow label="Position" value={
                      activeTrip.lastLat
                        ? `${activeTrip.lastLat.toFixed(4)}, ${activeTrip.lastLng?.toFixed(4)}`
                        : "Waiting..."
                    } />
                  </>
                )}
              </Card>
            ) : (
              <Card>
                <Text style={{
                  color:     C.muted,
                  fontSize:  14,
                  textAlign: "center",
                  paddingVertical: 16,
                }}>
                  No vehicle assigned.{"\n"}Contact your Fleet Manager.
                </Text>
              </Card>
            )}
          </View>

          {/* Trip Control */}
          {myVehicle && (
            <View style={{ gap: 12 }}>
              {!activeTrip ? (
                <Btn
                  onPress={() => startMut.mutate()}
                  loading={startMut.isPending}
                  full
                  large
                  disabled={myVehicle.status === "IN_TRIP"}
                >
                  START TRIP
                </Btn>
              ) : (
                <Btn
                  onPress={handleEndTrip}
                  loading={endMut.isPending}
                  variant="danger"
                  full
                  large
                >
                  END TRIP
                </Btn>
              )}
            </View>
          )}

          {/* Recent Trips */}
          <View>
            <SectionLabel>Recent Trips</SectionLabel>
            {trips.length === 0 ? (
              <Card>
                <Text style={{ color: C.faint, fontSize: 13, textAlign: "center", paddingVertical: 8 }}>
                  No trips yet
                </Text>
              </Card>
            ) : (
              trips.map((trip: any) => (
                <Card key={trip.id} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={{ color: C.text, fontSize: 15, fontWeight: "700" }}>
                        {new Date(trip.startTime).toLocaleDateString()}
                      </Text>
                      <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                        {trip.distanceKm
                          ? `${Number(trip.distanceKm).toFixed(2)} km`
                          : "Distance calculating..."
                        }
                        {trip.invoice
                          ? ` · $${Number(trip.invoice.totalAmount).toFixed(2)}`
                          : ""
                        }
                      </Text>
                    </View>
                    <Badge color={
                      trip.status === "COMPLETED"   ? "green" :
                      trip.status === "ACTIVE"      ? "amber" :
                      trip.status === "FORCE_ENDED" ? "red"   : "slate"
                    }>
                      {trip.status}
                    </Badge>
                  </View>
                </Card>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
