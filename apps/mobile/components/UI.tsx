import React, { ReactNode } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

// ─── Colors ───────────────────────────────────────────────────────────────────

export const C = {
  bg:      "#000000",
  surface: "#0a0a0a",
  border:  "#1a1a1a",
  border2: "#2a2a2a",
  text:    "#ffffff",
  muted:   "#666666",
  faint:   "#333333",
  amber:   "#f59e0b",
  green:   "#10b981",
  red:     "#ef4444",
  blue:    "#3b82f6",
};

// ─── Button ───────────────────────────────────────────────────────────────────

type BtnVariant = "primary" | "danger" | "ghost" | "outline";

export function Btn({
  children,
  onPress,
  variant  = "primary",
  loading  = false,
  disabled = false,
  full     = false,
  large    = false,
  icon,
}: {
  children:  ReactNode;
  onPress:   () => void;
  variant?:  BtnVariant;
  loading?:  boolean;
  disabled?: boolean;
  full?:     boolean;
  large?:    boolean;
  icon?:     ReactNode;
}) {
  const bg: Record<BtnVariant, string> = {
    primary: C.amber,
    danger:  C.red,
    ghost:   "transparent",
    outline: "transparent",
  };

  const fg: Record<BtnVariant, string> = {
    primary: "#000",
    danger:  "#fff",
    ghost:   C.muted,
    outline: C.text,
  };

  const border: Record<BtnVariant, string> = {
    primary: C.amber,
    danger:  C.red,
    ghost:   "transparent",
    outline: C.border2,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={{
        backgroundColor: bg[variant],
        borderColor:     border[variant],
        borderWidth:     1,
        height:          large ? 64 : 52,
        paddingHorizontal: 20,
        borderRadius:    2,
        flexDirection:   "row",
        alignItems:      "center",
        justifyContent:  "center",
        gap:             8,
        opacity:         disabled || loading ? 0.4 : 1,
        ...(full ? { width: "100%" } : {}),
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={fg[variant]}
        />
      ) : (
        icon
      )}
      <Text
        style={{
          color:       fg[variant],
          fontSize:    large ? 18 : 15,
          fontWeight:  "900",
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────

export function Field({
  label,
  error,
  ...rest
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{
          color:         C.muted,
          fontSize:      11,
          letterSpacing: 2,
          textTransform: "uppercase",
          fontWeight:    "700",
        }}>
          {label}
        </Text>
      )}
      <TextInput
        placeholderTextColor={C.faint}
        style={{
          backgroundColor: C.surface,
          borderColor:     error ? C.red : C.border,
          borderWidth:     1,
          color:           C.text,
          fontSize:        16,
          height:          52,
          paddingHorizontal: 16,
          borderRadius:    2,
          fontFamily:      "monospace",
        }}
        {...rest}
      />
      {error && (
        <Text style={{ color: C.red, fontSize: 12 }}>{error}</Text>
      )}
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
  pad = 16,
}: {
  children: ReactNode;
  style?:   ViewStyle;
  pad?:     number;
}) {
  return (
    <View style={[{
      backgroundColor: C.surface,
      borderColor:     C.border,
      borderWidth:     1,
      borderRadius:    2,
      padding:         pad,
    }, style]}>
      {children}
    </View>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text style={{
      color:         C.muted,
      fontSize:      10,
      letterSpacing: 3,
      textTransform: "uppercase",
      fontWeight:    "700",
      marginBottom:  8,
    }}>
      {children}
    </Text>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeColor = "amber" | "green" | "red" | "slate";

export function Badge({
  children,
  color = "slate",
}: {
  children: ReactNode;
  color?:   BadgeColor;
}) {
  const colors: Record<BadgeColor, [string, string]> = {
    amber: [C.amber,        "#1a0f00"],
    green: [C.green,        "#001a0f"],
    red:   [C.red,          "#1a0000"],
    slate: [C.muted,        "#111111"],
  };

  const [fg, bg] = colors[color];

  return (
    <View style={{
      backgroundColor: bg,
      borderColor:     fg + "30",
      borderWidth:     1,
      paddingHorizontal: 8,
      paddingVertical:   3,
      borderRadius:    2,
      alignSelf:       "flex-start",
    }}>
      <Text style={{
        color:       fg,
        fontSize:    11,
        fontWeight:  "700",
        letterSpacing: 1,
        textTransform: "uppercase",
      }}>
        {children}
      </Text>
    </View>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ mt = 0, mb = 0 }: { mt?: number; mb?: number }) {
  return (
    <View style={{
      height:          1,
      backgroundColor: C.border,
      marginTop:       mt,
      marginBottom:    mb,
    }} />
  );
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────

export function StatRow({
  label,
  value,
  accent,
}: {
  label:   string;
  value:   string | number;
  accent?: boolean | string;
}) {
  const accentColor =
    typeof accent === "string" ? accent :
    accent ? C.amber :
    C.text;

  return (
    <View style={{
      flexDirection:  "row",
      justifyContent: "space-between",
      alignItems:     "center",
      paddingVertical: 10,
      borderBottomColor: C.border,
      borderBottomWidth: 1,
    }}>
      <Text style={{
        color:         C.muted,
        fontSize:      12,
        letterSpacing: 1,
        textTransform: "uppercase",
        fontWeight:    "600",
      }}>
        {label}
      </Text>
      <Text style={{
        color:      accentColor,
        fontSize:   16,
        fontWeight: "900",
        fontFamily: "monospace",
      }}>
        {value}
      </Text>
    </View>
  );
}
