import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";

import { createTRPCClient, trpc } from "@/lib/trpc";

export function TrpcProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 4_000 } } }));
  const [client] = useState(() => createTRPCClient());
  return <trpc.Provider client={client} queryClient={queryClient}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></trpc.Provider>;
}
