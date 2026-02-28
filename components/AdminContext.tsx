"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import React, { createContext, useContext, useState } from "react";

interface AdminContextType {
  isCreateBookingOpen: boolean;
  setCreateBookingOpen: (open: boolean) => void;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [isCreateBookingOpen, setCreateBookingOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  return (
    <SessionProvider session={session}>
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
    </SessionProvider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
