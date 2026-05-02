import { supabase } from "@/lib/supabase";
import type { Profile, SupabaseResult, SupabaseMutationResult } from "@/types";

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

export async function checkSubscription(
  userId: string
): Promise<{ isActive: boolean; expiresAt: Date | null }> {
  const { data } = await supabase
    .from("profiles")
    .select("is_active, subscription_expires")
    .eq("id", userId)
    .single();

  if (!data) return { isActive: false, expiresAt: null };

  const now = new Date();
  const expiresAt = data.subscription_expires ? new Date(data.subscription_expires) : null;

  const isActive = data.is_active && (expiresAt ? expiresAt > now : false);

  return { isActive, expiresAt };
}

export type { Profile } from "@/types";
