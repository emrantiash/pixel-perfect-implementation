import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth";
import { ensureAgentForUser, useAgentForUser } from "@/lib/mock/agents";
import { walletApi } from "@/lib/api/wallet";
import { isApiConfigured } from "@/lib/api/client";

/** Current agent session + profile. The profile is created only after a session exists. */
export function useAgent() {
  const session = useSession();
  useEffect(() => { if (session?.role === "agent") ensureAgentForUser(session); }, [session]);
  const agent = useAgentForUser(session?.userId);
  return { session, agent };
}

export function useWallet(agentId?: string) {
  return useQuery({
    queryKey: ["wallet", agentId],
    queryFn: ({ signal }) => walletApi.getWallet(agentId!, signal),
    enabled: !!agentId && isApiConfigured(),
    retry: false,
  });
}
export function useAgentTransactions(agentId: string | undefined, page: number, limit = 10) {
  return useQuery({
    queryKey: ["wallet-tx", agentId, page, limit],
    queryFn: ({ signal }) => walletApi.getAgentTransactions(agentId!, page, limit, signal),
    enabled: !!agentId && isApiConfigured(),
    retry: false,
  });
}
