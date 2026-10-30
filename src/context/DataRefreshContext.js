import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { onDataChanged } from "../utils/dataRefreshEvents";
import { onSessionChange } from "../utils/StorageUtils";
import { projectRequestCache } from "../utils/requestCache";

const DataRefreshContext = createContext(null);

export function DataRefreshProvider({ children }) {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const refreshData = useCallback(() => {
    projectRequestCache.clear();
    setRefreshVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const unsubscribe = onDataChanged(refreshData);
    // Profile reads also persist session metadata; do not turn those writes
    // into another global fetch cycle.
    const unsubscribeSession = onSessionChange(() => projectRequestCache.clear());
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshData();
    });

    return () => {
      unsubscribe();
      appStateSubscription.remove();
      unsubscribeSession();
    };
  }, [refreshData]);

  return (
    <DataRefreshContext.Provider value={{ refreshVersion, refreshData }}>
      {children}
    </DataRefreshContext.Provider>
  );
}

export function useDataRefresh() {
  const value = useContext(DataRefreshContext);
  if (!value) throw new Error("useDataRefresh requires DataRefreshProvider");
  return value;
}
