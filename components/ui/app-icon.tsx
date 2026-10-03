import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import type { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

export type AppIconName = ComponentProps<typeof MaterialIcons>["name"];

export function AppIcon({
  name,
  size = 18,
  color,
  style,
}: {
  name: AppIconName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}
