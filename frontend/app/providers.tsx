"use client";

import { QueryClientProvider } from "@tanstack/react-query";

import { getBrowserQueryClient } from "@/lib/query/get-query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getBrowserQueryClient();

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
