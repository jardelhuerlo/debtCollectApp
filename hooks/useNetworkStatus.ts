import { useState, useEffect, useCallback } from "react";
import NetInfo from "@react-native-community/netinfo";

interface NetworkState {
  isConnected: boolean;
  isOffline: boolean;
}

export function useNetworkStatus(): NetworkState {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return unsubscribe;
  }, []);

  return {
    isConnected,
    isOffline: !isConnected,
  };
}

export function checkOnline(): Promise<boolean> {
  return NetInfo.fetch().then((state) => state.isConnected ?? false);
}
