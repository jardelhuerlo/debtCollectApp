import React from "react";
import Toast from "react-native-toast-message";
import { ErrorBoundary } from "./ErrorBoundary";

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ErrorBoundary>
      {children}
      <Toast />
    </ErrorBoundary>
  );
}
