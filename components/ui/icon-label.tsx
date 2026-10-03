import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";

export function IconLabel({
  icon,
  color,
  iconColor,
  size = 18,
  style,
  textStyle,
  children,
}: {
  icon: AppIconName;
  color: string;
  iconColor?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  children: ReactNode;
}) {
  return (
    <View style={[s.row, style]}>
      <AppIcon name={icon} size={size} color={iconColor ?? color} />
      <Text style={[s.text, { color }, textStyle]}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  text: { flexShrink: 1 },
});
