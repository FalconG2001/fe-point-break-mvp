"use client";

import React, { createContext, useContext, useState } from "react";

interface AdminContextType {
  isCreateBookingOpen: boolean;
  setCreateBookingOpen: (open: boolean) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isCreateBookingOpen, setCreateBookingOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <AdminContext.Provider
      value={{
        isCreateBookingOpen,
        setCreateBookingOpen,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
