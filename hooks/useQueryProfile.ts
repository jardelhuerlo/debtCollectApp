import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProfile } from "@/services/profile.service";
import { getCurrentUser } from "@/services/auth.service";
import type { Profile } from "@/types";

const PROFILE_KEY = "profile";

export function useProfileQuery() {
  return useQuery<Profile>({
    queryKey: [PROFILE_KEY],
    queryFn: async () => {
      const user = await getCurrentUser();
      if (!user) throw new Error("No user");
      const { data, error } = await fetchProfile(user.id);
      if (error) throw error;
      if (!data) throw new Error("Profile not found");
      return data;
    },
  });
}

export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [PROFILE_KEY] });
  };
}
