import { useCallback, useEffect, useState } from "react";
import { fetchProfile, checkSubscription, type Profile } from "@/services/profile.service";
import { getCurrentUser } from "@/services/auth.service";

interface UseProfileReturn {
  profile: Profile | null;
  isLoading: boolean;
  isExpired: boolean;
  expiresAt: Date | null;
  refreshProfile: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);

    const user = await getCurrentUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const [profileResult, subResult] = await Promise.all([
      fetchProfile(user.id),
      checkSubscription(user.id),
    ]);

    if (profileResult.data) {
      setProfile(profileResult.data);
    }

    setIsExpired(!subResult.isActive);
    setExpiresAt(subResult.expiresAt);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    isLoading,
    isExpired,
    expiresAt,
    refreshProfile: loadProfile,
  };
}
