import { useEffect, useState, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  getCurrentSession,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  onAuthStateChange,
} from "@/services/auth.service";
import * as Linking from "expo-linking";

interface UseAuthReturn {
  session: Session | null;
  isLoading: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isResetting: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: Error | null; session: Session | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    getCurrentSession().then((s) => {
      setSession(s);
      setIsLoading(false);
    });

    const { unsubscribe } = onAuthStateChange((s) => {
      setSession(s);
    });

    return unsubscribe;
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    setIsSigningIn(true);
    try {
      return await signInWithEmail(email, password);
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, fullName: string) => {
    setIsSigningUp(true);
    try {
      const redirectUrl = Linking.createURL("/(tabs)/loans-historyScreen");
      return await signUpWithEmail(email, password, fullName, redirectUrl);
    } finally {
      setIsSigningUp(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    return await signOut();
  }, []);

  const handleResetPassword = useCallback(async (email: string) => {
    setIsResetting(true);
    try {
      return await resetPassword(email);
    } finally {
      setIsResetting(false);
    }
  }, []);

  return {
    session,
    isLoading,
    isSigningIn,
    isSigningUp,
    isResetting,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
  };
}
