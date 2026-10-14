
const endpoint = {
  GetAllUsers: "/users",
  GetALLAgent: "/users/agents",
  GetAgentById: (id: string) => `/users/agents/${encodeURIComponent(id)}`,
  CreateUser: "/users",
  CreateAgent: "/users/agents",
  UpdateAgent: (id: string) => `/users/agents/${encodeURIComponent(id)}`,
  UpdateAgentVerification: (id: string) =>
    `/users/agents/${encodeURIComponent(id)}/verification`,

  GetAgentWallet: (agentId: string) =>
    `/wallet/agents/${encodeURIComponent(agentId)}`,
  GetAgentTransactions: (agentId: string) =>
    `/wallet/agents/${encodeURIComponent(agentId)}/transactions`,
  CreateTopUp: (agentId: string) =>
    `/wallet/agents/${encodeURIComponent(agentId)}/top-ups`,
  GetPendingTopUps: "/wallet/top-ups/pending",
  ApproveTopUp: (id: string) =>
    `/wallet/top-ups/${encodeURIComponent(id)}/approve`,
  RejectTopUp: (id: string) =>
    `/wallet/top-ups/${encodeURIComponent(id)}/reject`,
  GetAllWalletTransactions: "/wallet/transactions",
} as const;

export default endpoint;
