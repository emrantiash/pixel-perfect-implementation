import { apiRequest, toPage, type Page } from "./client";

export type Money = number | string;

export interface Wallet {
  id?: string;
  agentId: string;
  balance: Money;
  currency: string;
  walletExists?: boolean;
  updatedAt?: string;
}

export interface AgentRef {
  id: string;
  businessName?: string;
  companyName?: string;
  name?: string;
  email?: string;
}

export interface WalletTransaction {
  id: string;
  agentId?: string;
  agent?: AgentRef;
  type: string;
  amount: Money;
  balanceBefore?: Money;
  balanceAfter?: Money;
  currency?: string;
  bookingId?: string | null;
  reference?: string | null;
  description?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export type TopUpStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TopUpRequest {
  id: string;
  agentId: string;
  agent?: AgentRef;
  amount: Money;
  currency?: string;
  method: PaymentMethod;
  transactionReference?: string;
  proofUrl?: string | null;
  status: TopUpStatus;
  adminRemarks?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface AgentTopUpDetail extends TopUpRequest {
  proofUrl: string | null;
}

export const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "BKASH", label: "bKash" },
  { value: "NAGAD", label: "Nagad" },
  { value: "ROCKET", label: "Rocket" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Other" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

export const methodLabel = (method: string) =>
  PAYMENT_METHODS.find((item) => item.value === method)?.label ?? method;

export interface TopUpInput {
  amount: string;
  method: PaymentMethod;
  transactionReference?: string;
  proof?: File;
  previousTopUpId?: string;
}

export interface ApproveTopUpResponse {
  message: string;
  topUpId: string;
  status: TopUpStatus;
  transactionId: string;
  amount: Money;
  balanceBefore: Money;
  balanceAfter: Money;
  currency: string;
}

export interface RejectTopUpResponse {
  message: string;
  topUpId: string;
  status: TopUpStatus;
}

export const walletApi = {
  getWallet: (agentId: string, signal?: AbortSignal) =>
    apiRequest<Wallet>(`/wallet/agents/${encodeURIComponent(agentId)}`, { signal }),

  getAgentTransactions: async (
    agentId: string,
    page = 1,
    limit = 10,
    signal?: AbortSignal,
    search?: string,
  ): Promise<Page<WalletTransaction>> =>
    toPage(
      await apiRequest(`/wallet/agents/${encodeURIComponent(agentId)}/transactions`, {
        query: {
          page,
          limit,
          ...(search?.trim() ? { search: search.trim() } : {}),
        },
        signal,
      }),
      page,
      limit,
    ),

  getAgentTopUps: async (
    agentId: string,
    page = 1,
    limit = 10,
    signal?: AbortSignal,
  ): Promise<Page<TopUpRequest>> => {
    return toPage(
      await apiRequest(`/wallet/agents/${encodeURIComponent(agentId)}/top-ups`, {
        query: { page, limit },
        signal,
      }),
      page,
      limit,
    );
  },

  createTopUp: (agentId: string, input: TopUpInput) => {
    const formData = new FormData();

    formData.append("amount", input.amount);
    formData.append("method", input.method);

    if (input.transactionReference) {
      formData.append("transactionReference", input.transactionReference);
    }

    if (input.proof) {
      formData.append("proof", input.proof);
    }

    if (input.previousTopUpId) {
      formData.append("previousTopUpId", input.previousTopUpId);
    }

    return apiRequest<{
      message: string;
      topUpRequest: TopUpRequest;
    }>(`/wallet/agents/${encodeURIComponent(agentId)}/top-ups`, {
      method: "POST",
      body: formData,
    });
  },

  getPendingTopUps: async (
    page = 1,
    limit = 10,
    signal?: AbortSignal,
  ): Promise<Page<TopUpRequest>> =>
    toPage(
      await apiRequest("/wallet/top-ups/pending", {
        query: { page, limit },
        signal,
      }),
      page,
      limit,
    ),

  approveTopUp: (id: string, adminRemarks?: string) =>
    apiRequest<ApproveTopUpResponse>(`/wallet/top-ups/${encodeURIComponent(id)}/approve`, {
      method: "PATCH",
      body: adminRemarks ? { adminRemarks } : {},
    }),

  rejectTopUp: (id: string, adminRemarks?: string) =>
    apiRequest<RejectTopUpResponse>(`/wallet/top-ups/${encodeURIComponent(id)}/reject`, {
      method: "PATCH",
      body: adminRemarks ? { adminRemarks } : {},
    }),

  getAllTransactions: async (
    page = 1,
    limit = 20,
    signal?: AbortSignal,
    search?: string,
    type?: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<Page<WalletTransaction>> =>
    toPage(
      await apiRequest("/wallet/transactions", {
        query: {
          page,
          limit,
          ...(search?.trim() ? { search: search.trim() } : {}),
          ...(type ? { type } : {}),
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        },
        signal,
      }),
      page,
      limit,
    ),

  getAgentTopUp: (agentId: string, topUpId: string, signal?: AbortSignal) =>
    apiRequest<AgentTopUpDetail>(
      `/wallet/agents/${encodeURIComponent(agentId)}/top-ups/${encodeURIComponent(topUpId)}`,
      { signal },
    ),

  getTodayTransactionSummary: async (signal?: AbortSignal) =>
    apiRequest<{
      date: string;
      count: number;
      totalAmount: string;
      currency: string;
    }>("/wallet/transactions/today-summary", { signal }),
};

export function fmtMoney(value: Money | undefined | null, currency = "BDT") {
  if (value === undefined || value === null || value === "") return "—";

  const number = typeof value === "string" ? Number(value) : value;

  if (!Number.isFinite(number)) return String(value);

  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);

  return currency === "BDT" ? `৳ ${formatted}` : `${currency} ${formatted}`;
}

export const agentName = (agent?: AgentRef, fallbackId?: string) =>
  agent?.businessName ?? agent?.companyName ?? agent?.name ?? fallbackId ?? "—";

export const fmtDate = (date?: string | null) =>
  date
    ? new Date(date).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
