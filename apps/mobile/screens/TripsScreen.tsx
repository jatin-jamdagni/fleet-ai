import React from "react";
import { View, Text, FlatList, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { tripsApi } from "../lib/api";
import { Card, Badge, SectionLabel, StatRow, Divider, C } from "../components/UI";

export default function TripsScreen() {
  const { data: tripsRes, isLoading, refetch } = useQuery({
    queryKey: ["my-trips-full"],
    queryFn:  () => tripsApi.myTrips({ pageSize: 30 }).then((r) => r.data),
  });

  const trips = tripsRes?.data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <View style={{
        paddingHorizontal: 20,
        paddingVertical:   14,
        borderBottomColor: C.border,
        borderBottomWidth: 1,
      }}>
        <Text style={{
          color:         C.amber,
          fontSize:      11,
          fontWeight:    "700",
          letterSpacing: 3,
        }}>
          TRIP HISTORY
        </Text>
        <Text style={{
          color:      C.text,
          fontSize:   22,
          fontWeight: "900",
          marginTop:  2,
        }}>
          {tripsRes?.meta?.total ?? 0} TRIPS
        </Text>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(t: any) => t.id}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <Text style={{ color: C.faint, fontSize: 13, letterSpacing: 1 }}>
              NO TRIPS YET
            </Text>
          </View>
        }
        renderItem={({ item: trip }: { item: any }) => (
          <Card>
            <View style={{
              flexDirection:  "row",
              justifyContent: "space-between",
              alignItems:     "flex-start",
              marginBottom:   12,
            }}>
              <View>
                <Text style={{
                  color:      C.text,
                  fontSize:   16,
                  fontWeight: "900",
                }}>
                  {new Date(trip.startTime).toLocaleDateString("en-US", {
                    weekday: "short",
                    month:   "short",
                    day:     "numeric",
                  })}
                </Text>
                <Text style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>
                  {trip.vehicle?.licensePlate} ·{" "}
                  {new Date(trip.startTime).toLocaleTimeString("en-US", {
                    hour:   "2-digit",
                    minute: "2-digit",
                  })}
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

            <Divider mb={12} />

            <View style={{ flexDirection: "row", gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 2 }}>
                  DISTANCE
                </Text>
                <Text style={{
                  color:      trip.distanceKm ? C.text : C.faint,
                  fontSize:   20,
                  fontWeight: "900",
                  marginTop:  2,
                }}>
                  {trip.distanceKm
                    ? `${Number(trip.distanceKm).toFixed(2)}`
                    : "—"
                  }
                  <Text style={{ fontSize: 13, fontWeight: "400", color: C.muted }}>
                    {trip.distanceKm ? " km" : ""}
                  </Text>
                </Text>
              </View>

              {trip.invoice && (
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 2 }}>
                    INVOICE
                  </Text>
                  <Text style={{
                    color:      C.amber,
                    fontSize:   20,
                    fontWeight: "900",
                    marginTop:  2,
                  }}>
                    ${Number(trip.invoice.totalAmount).toFixed(2)}
                  </Text>
                </View>
              )}

              {trip.endTime && (
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 2 }}>
                    DURATION
                  </Text>
                  <Text style={{
                    color:      C.text,
                    fontSize:   20,
                    fontWeight: "900",
                    marginTop:  2,
                  }}>
                    {(() => {
                      const ms  = new Date(trip.endTime).getTime() -
                                  new Date(trip.startTime).getTime();
                      const h   = Math.floor(ms / 3_600_000);
                      const m   = Math.floor((ms % 3_600_000) / 60_000);
                      return h > 0 ? `${h}h ${m}m` : `${m}m`;
                    })()}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}