"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ReactNode, useState } from "react";
import { UserDataProvider } from "@/components/users/UserDataProvider";
import { NotificationProvider } from "@/components/provider/NotificationProvider";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <UserDataProvider>{children}</UserDataProvider>
      <ReactQueryDevtools initialIsOpen={false} />
      <NotificationProvider />
    </QueryClientProvider>
  );
}
