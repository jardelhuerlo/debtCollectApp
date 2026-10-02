import { supabase } from "@/lib/supabase";
import type { Profile, SupabaseResult, SupabaseMutationResult } from "@/types";

export interface SubscriptionStatus {
  isActive: boolean;
  expiresAt: Date | null;
  daysRemaining: number;
  plan: string;
  isExpiringSoon: boolean;
}

export async function fetchProfile(userId: string): Promise<SupabaseResult<Profile>> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

  if (error) return { data: null, error };
  return { data: data as Profile, error: null };
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<SupabaseMutationResult> {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);

  return { error };
}

export async function checkSubscription(userId: string): Promise<SubscriptionStatus> {
  const { data } = await supabase
    .from("profiles")
    .select("is_active, subscription_expires, role")
    .eq("id", userId)
    .single();

  if (!data) {
    return {
      isActive: false,
      expiresAt: null,
      daysRemaining: 0,
      plan: "none",
      isExpiringSoon: false,
    };
  }

  const now = new Date();
  const expiresAt = data.subscription_expires ? new Date(data.subscription_expires) : null;

  if (!expiresAt) {
    return {
      isActive: false,
      expiresAt: null,
      daysRemaining: 0,
      plan: data.role || "none",
      isExpiringSoon: false,
    };
  }

  const diffMs = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const isActive = data.is_active && daysRemaining > 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;

  return {
    isActive,
    expiresAt,
    daysRemaining: Math.max(0, daysRemaining),
    plan: data.role || "none",
    isExpiringSoon,
  };
}

export type { Profile } from "@/types";
