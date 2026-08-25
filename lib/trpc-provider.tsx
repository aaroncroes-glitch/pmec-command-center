import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";
import { type PropsWithChildren, useEffect, useState } from "react";

import { createTRPCClient, setClerkTokenGetter, trpc } from "@/lib/trpc";

export function TrpcProvider({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 4_000 } } }));
  const [client] = useState(() => createTRPCClient());
  return <trpc.Provider client={client} queryClient={queryClient}><QueryClientProvider client={queryClient}>{children}</QueryClientProvider></trpc.Provider>;
}

export function ClerkTrpcProvider({ children }: PropsWithChildren) {
  const { getToken } = useAuth();
  useEffect(() => {
    setClerkTokenGetter(async () => (await getToken()) ?? null);
    return () => setClerkTokenGetter(null);
  }, [getToken]);
  return <TrpcProvider>{children}</TrpcProvider>;
}
