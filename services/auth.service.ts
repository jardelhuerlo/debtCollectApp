import { supabase } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import type { SupabaseMutationResult } from "@/types";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimiter";
import { sanitizeEmail, sanitizeString } from "@/lib/sanitize";
import { getRecoveryUrl } from "@/lib/deepLink";

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<SupabaseMutationResult> {
  const sanitizedEmail = sanitizeEmail(email);
  const rateLimit = checkRateLimit(sanitizedEmail);

  if (!rateLimit.allowed) {
    return {
      error: new Error(
        `Demasiados intentos. Intenta de nuevo en ${rateLimit.retryAfter} segundos.`
      ),
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: sanitizedEmail,
    password,
  });

  if (!error) {
    resetRateLimit(sanitizedEmail);
  }

  return { error };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
  redirectUrl?: string
): Promise<{ error: Error | null; session: Session | null }> {
  const sanitizedEmail = sanitizeEmail(email);
  const sanitizedFullName = sanitizeString(fullName);

  const { data, error } = await supabase.auth.signUp({
    email: sanitizedEmail,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: { full_name: sanitizedFullName },
    },
  });
  return { error, session: data.session };
}

export async function signOut(): Promise<SupabaseMutationResult> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email: string): Promise<SupabaseMutationResult> {
  const sanitizedEmail = sanitizeEmail(email);
  const redirectUrl = getRecoveryUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
    redirectTo: redirectUrl,
  });
  return { error };
}

export function onAuthStateChange(callback: (session: Session | null) => void): {
  unsubscribe: () => void;
} {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return { unsubscribe: () => data.subscription.unsubscribe() };
}
