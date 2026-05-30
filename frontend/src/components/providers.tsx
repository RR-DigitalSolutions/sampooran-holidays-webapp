"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";

import { setBaseUrl } from "@workspace/api-client-react";
import { getApiBase } from "@/lib/api-url";

// setBaseUrl takes the BASE url WITHOUT /api — the generated hooks
// already include /api in their paths (e.g. "/api/packages").
if (typeof window !== "undefined") {
  setBaseUrl(getApiBase());
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
