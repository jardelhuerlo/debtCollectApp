import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, Dimensions } from "react-native";
import { Colors, Radius } from "@/constants/styles";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = Radius.sm,
  style,
}: SkeletonLoaderProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [anim]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: Colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function CardSkeleton() {
  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <SkeletonLoader width={140} height={22} />
        <SkeletonLoader width={30} height={30} borderRadius={Radius.sm} />
      </View>
      <SkeletonLoader width={80} height={14} style={{ marginTop: 8 }} />
      <SkeletonLoader width={180} height={18} style={{ marginTop: 12 }} />
      <SkeletonLoader width={120} height={18} style={{ marginTop: 6 }} />
      <View style={s.badgeRow}>
        <SkeletonLoader width={80} height={24} borderRadius={12} />
      </View>
      <View style={s.btnRow}>
        <SkeletonLoader width={120} height={40} borderRadius={Radius.md} />
        <SkeletonLoader width={100} height={40} borderRadius={Radius.md} />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={s.profile}>
      <SkeletonLoader width={80} height={80} borderRadius={40} />
      <SkeletonLoader width={160} height={24} style={{ marginTop: 16 }} />
      <SkeletonLoader width={120} height={16} style={{ marginTop: 8 }} />
      <SkeletonLoader width={140} height={16} style={{ marginTop: 6 }} />
      <SkeletonLoader width={180} height={16} style={{ marginTop: 6 }} />
      <SkeletonLoader width="100%" height={50} borderRadius={Radius.md} style={{ marginTop: 40 }} />
    </View>
  );
}

const { width } = Dimensions.get("window");

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badgeRow: { marginTop: 12 },
  btnRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  profile: { alignItems: "center", padding: 24 },
});
