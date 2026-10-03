import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SubscriptionWarningBanner } from "@/components/SubscriptionWarningBanner";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getCurrentSession } from "@/services/auth.service";
import { checkSubscription } from "@/services/profile.service";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isSubActive, setIsSubActive] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const activeColor = "#4f9cff";
  const inactiveColor = "#9ca3af";

  useEffect(() => {
    const loadInitialRoute = async () => {
      const session = await getCurrentSession();

      if (!session) {
        setInitialRoute("userScreen");
        return;
      }

      const status = await checkSubscription(session.user.id);
      setIsSubActive(status.isActive);
      setDaysRemaining(status.daysRemaining);

      if (!status.isActive) {
        setInitialRoute("userScreen");
      } else {
        setInitialRoute("loans-historyScreen");
      }
    };

    loadInitialRoute();
  }, []);

  if (!initialRoute) return null;

  return (
    <View style={{ flex: 1 }}>
      <SubscriptionWarningBanner daysRemaining={isSubActive ? daysRemaining : 0} />
      <Tabs
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarActiveTintColor: activeColor,
          tabBarInactiveTintColor: inactiveColor,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopWidth: 1,
            borderTopColor: "#e2e8f0",
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="loans-historyScreen"
          options={{
            title: "Préstamo",
            href: isSubActive ? undefined : null,
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="banknote.fill" color={color} />,
          }}
        />

        <Tabs.Screen
          name="loansScreen"
          options={{
            title: "Registro",
            href: isSubActive ? undefined : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="plus.circle.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="userScreen"
          options={{
            title: "Usuario",
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
