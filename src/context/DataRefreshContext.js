import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AppState } from "react-native";
import { onDataChanged } from "../utils/dataRefreshEvents";

const DataRefreshContext = createContext(null);
const AUTO_REFRESH_INTERVAL = 10000;

export function DataRefreshProvider({ children }) {
  const [refreshVersion, setRefreshVersion] = useState(0);
  const refreshData = useCallback(() => {
    setRefreshVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    const unsubscribe = onDataChanged(refreshData);
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshData();
    });
    const interval = setInterval(() => {
      if (AppState.currentState === "active") refreshData();
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      unsubscribe();
      appStateSubscription.remove();
      clearInterval(interval);
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
