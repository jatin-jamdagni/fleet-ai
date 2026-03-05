import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth.store";
import {  Card, StatRow, SectionLabel, C } from "../components/UI";

type HosStatus = "OK" | "WARNING" | "OVER_LIMIT";

type ScoreSummary = {
  currentScore: number | null;
  trend: number | null;
  totalTrips: number;
  totalDistanceKm: string;
  totalSpeedingEvents: number;
  totalHoursOnRoad: string;
};

type HosDay = {
  drivingMin: number;
  drivingHours: string;
  pct: number;
  date: string | Date;
};

type HosSummary = {
  today: {
    drivingMin: number;
    drivingHours: string;
    limitMin: number;
    limitHours: string;
    remainingMin: number;
    remainingHours: string;
    pct: number;
    status: HosStatus;
  };
  weekly: HosDay[];
  totalWeeklyHours: string;
};

const safetyApi = {
  myScore: (userId: string) =>
    api.get(`/safety/scores/${userId}?days=30`).then((r) => r.data.data as ScoreSummary),
  myHos:   (userId: string) =>
    api.get(`/safety/hos/${userId}?days=7`).then((r) => r.data.data as HosSummary),
};

function ScoreRing({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <View style={styles.ringContainer}>
        <Text style={styles.ringScore}>—</Text>
        <Text style={styles.ringLabel}>NO DATA</Text>
      </View>
    );
  }

  const color = score >= 90 ? C.green
              : score >= 75 ? C.amber
              : C.red;

  const grade = score >= 90 ? "A"
              : score >= 80 ? "B"
              : score >= 70 ? "C"
              : score >= 60 ? "D"
              : "F";

  return (
    <View style={styles.ringContainer}>
      <Text style={[styles.ringScore, { color }]}>{score}</Text>
      <Text style={[styles.ringGrade, { color }]}>{grade}</Text>
      <Text style={styles.ringLabel}>SAFETY SCORE</Text>
    </View>
  );
}

export default function SafetyScreen() {
  const user = useAuthStore((s) => s.user);

  const { data: scoreData, isLoading: scoreLoading } = useQuery<ScoreSummary>({
    queryKey: ["my-score", user?.id],
    queryFn:  () => safetyApi.myScore(user!.id),
    enabled:  !!user?.id,
    refetchInterval: 60_000,
  });

  const { data: hosData, isLoading: hosLoading } = useQuery<HosSummary>({
    queryKey: ["my-hos", user?.id],
    queryFn:  () => safetyApi.myHos(user!.id),
    enabled:  !!user?.id,
    refetchInterval: 60_000,
  });

  const today      = hosData?.today;
  const hosColor   = today?.status === "OVER_LIMIT" ? C.red
                   : today?.status === "WARNING"    ? C.amber
                   : C.green;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Score Ring */}
      <Card style={styles.scoreCard}>
        <ScoreRing score={scoreData?.currentScore ?? null} />
        {scoreData?.trend !== null && scoreData?.trend !== undefined && (
          <Text style={[styles.trend, {
            color: scoreData.trend >= 0 ? C.green : C.red,
          }]}>
            {scoreData.trend >= 0 ? "↑" : "↓"} {Math.abs(scoreData.trend)} vs last week
          </Text>
        )}
      </Card>

      {/* Score Breakdown */}
      <SectionLabel>Score Breakdown (30 days)</SectionLabel>
      <Card>
        <StatRow
          label="Total Trips"
          value={scoreData?.totalTrips ?? "—"}
        />
        <StatRow
          label="Total Distance"
          value={scoreData?.totalDistanceKm
            ? `${Number(scoreData.totalDistanceKm).toFixed(0)} km`
            : "—"}
        />
        <StatRow
          label="Speeding Events"
          value={scoreData?.totalSpeedingEvents ?? 0}
          accent={
            (scoreData?.totalSpeedingEvents ?? 0) > 0 ? C.red : undefined
          }
        />
        <StatRow
          label="Hours on Road"
          value={scoreData?.totalHoursOnRoad
            ? `${scoreData.totalHoursOnRoad}h`
            : "—"}
        />
      </Card>

      {/* HOS Today */}
      <SectionLabel>Hours of Service — Today</SectionLabel>
      <Card>
        <View style={styles.hosHeader}>
          <Text style={[styles.hosHours, { color: hosColor }]}>
            {today?.drivingHours ?? "0.0"}h
          </Text>
          <Text style={styles.hosLimit}>
            / {today?.limitHours ?? "10"}h limit
          </Text>
        </View>

        {/* Progress bar */}
        <View style={styles.hosBarBg}>
          <View style={[styles.hosBarFill, {
            width: `${Math.min(today?.pct ?? 0, 100)}%`,
            backgroundColor: hosColor,
          }]} />
        </View>

        <StatRow
          label="Remaining Today"
          value={`${today?.remainingHours ?? "10.0"}h`}
          accent={today?.status !== "OK" ? hosColor : undefined}
        />
        <StatRow
          label="Status"
          value={today?.status?.replace("_", " ") ?? "OK"}
          accent={today?.status !== "OK" ? hosColor : undefined}
        />
      </Card>

      {/* Weekly HOS */}
      {hosData?.weekly && hosData.weekly.length > 0 && (
        <>
          <SectionLabel>
            Weekly Summary ({hosData.totalWeeklyHours}h total)
          </SectionLabel>
          <Card>
            {hosData.weekly.map((day, i) => {
              const dayColor = day.pct >= 100 ? C.red
                             : day.pct >= 85  ? C.amber
                             : C.green;
              return (
                <View key={i} style={styles.weekRow}>
                  <Text style={styles.weekDay}>
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                    })}
                  </Text>
                  <View style={styles.weekBarBg}>
                    <View style={[styles.weekBarFill, {
                      width: `${Math.min(day.pct, 100)}%`,
                      backgroundColor: dayColor,
                    }]} />
                  </View>
                  <Text style={[styles.weekHours, { color: dayColor }]}>
                    {day.drivingHours}h
                  </Text>
                </View>
              );
            })}
          </Card>
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  content:      { padding: 16, paddingBottom: 40 },
  scoreCard:    { alignItems: "center", paddingVertical: 32, marginBottom: 20 },
  ringContainer:{ alignItems: "center" },
  ringScore:    { fontSize: 72, fontWeight: "900", fontFamily: "Courier New",
                  lineHeight: 80 },
  ringGrade:    { fontSize: 28, fontWeight: "900", fontFamily: "Courier New",
                  marginTop: -8 },
  ringLabel:    { fontSize: 10, color: C.muted, letterSpacing: 4,
                  marginTop: 8, fontFamily: "Courier New" },
  trend:        { fontSize: 13, fontWeight: "700", fontFamily: "Courier New",
                  marginTop: 12 },
  hosHeader:    { flexDirection: "row", alignItems: "baseline",
                  marginBottom: 12 },
  hosHours:     { fontSize: 36, fontWeight: "900", fontFamily: "Courier New" },
  hosLimit:     { fontSize: 14, color: C.muted, marginLeft: 8,
                  fontFamily: "Courier New" },
  hosBarBg:     { height: 6, backgroundColor: C.border, marginBottom: 16 },
  hosBarFill:   { height: 6 },
  weekRow:      { flexDirection: "row", alignItems: "center",
                  paddingVertical: 8, borderBottomWidth: 1,
                  borderBottomColor: C.border },
  weekDay:      { fontSize: 11, color: C.muted, fontFamily: "Courier New",
                  width: 100 },
  weekBarBg:    { flex: 1, height: 4, backgroundColor: C.border, marginHorizontal: 8 },
  weekBarFill:  { height: 4 },
  weekHours:    { fontSize: 11, fontWeight: "700", fontFamily: "Courier New",
                  width: 36, textAlign: "right" },
});
