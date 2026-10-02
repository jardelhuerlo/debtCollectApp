import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Styles } from "../constants/styles";
import { checkSubscription } from "@/services/profile.service";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        const status = await checkSubscription(data.session.user.id);
        if (status.isActive) {
          router.replace("/(tabs)/loans-historyScreen");
        } else {
          router.replace("/subscriptionExpiredScreen");
        }
      } else {
        router.replace("/loginScreen");
      }
    };

    checkSession();
  }, []);

  return (
    <View style={Styles.center}>
      <ActivityIndicator size="large" />
    </View>
  );
}
