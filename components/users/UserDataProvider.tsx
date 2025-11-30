"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  useCurrentUser();

  return <>{children}</>;
}
