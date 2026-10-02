import { useEffect, useState } from "react";
import { useRouter, usePathname } from "expo-router";
import { checkSubscription } from "@/services/profile.service";
import { getCurrentUser } from "@/services/auth.service";
import type { SubscriptionStatus } from "@/services/profile.service";

const PROTECTED_ROUTES = [
  "/(tabs)/loans-historyScreen",
  "/(tabs)/loansScreen",
  "/loans-historyScreen",
  "/loansScreen",
];

const EXPIRED_ROUTE = "/subscriptionExpiredScreen";

export function useSubscriptionGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const user = await getCurrentUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const status = await checkSubscription(user.id);
      setSubscription(status);
      setIsLoading(false);

      if (
        !status.isActive &&
        PROTECTED_ROUTES.some((r) => pathname.includes(r.split("/").pop() || ""))
      ) {
        router.replace(EXPIRED_ROUTE);
      }
    };

    check();
  }, [pathname, router]);

  return { subscription, isLoading };
}

export function useRedirectAfterLogin() {
  const router = useRouter();

  return async (sessionExists: boolean) => {
    if (!sessionExists) return;

    const user = await getCurrentUser();
    if (!user) {
      router.replace("/(tabs)/loans-historyScreen");
      return;
    }

    const status = await checkSubscription(user.id);
    if (status.isActive) {
      router.replace("/(tabs)/loans-historyScreen");
    } else {
      router.replace(EXPIRED_ROUTE);
    }
  };
}
