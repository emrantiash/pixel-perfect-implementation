// Wallet API — mirrors the existing NestJS wallet controller routes.
// Field names follow the Prisma models as currently understood; align with backend DTOs if they differ.
import { apiRequest, toPage, type Page } from "./client";

export type Money = number | string;
export interface Wallet { id?: string | undefined; agentId: string; balance: Money; currency: string; updatedAt?: string | undefined }
export interface AgentRef { id: string; businessName?: string | undefined; companyName?: string | undefined; name?: string | undefined; email?: string | undefined }
export interface WalletTransaction {
  id: string; agentId?: string | undefined; agent?: AgentRef | undefined; type: string; amount: Money;
  balanceBefore?: Money | undefined; balanceAfter?: Money | undefined; currency?: string | undefined; bookingId?: string | null | undefined;
  reference?: string | null | undefined; description?: string | null | undefined; createdBy?: string | null | undefined; createdAt: string;
}
export type TopUpStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface TopUpRequest {
  id: string; agentId: string; agent?: AgentRef | undefined; amount: Money; currency?: string | undefined;
  paymentMethod: PaymentMethod; transactionReference?: string | undefined; paymentProofUrl?: string | null | undefined;
  status: TopUpStatus; remarks?: string | null | undefined; adminRemarks?: string | null | undefined; createdAt: string; reviewedAt?: string | null | undefined;
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
export const methodLabel = (m: string) => PAYMENT_METHODS.find((p) => p.value === m)?.label ?? m;

export interface TopUpInput { amount: number; paymentMethod: PaymentMethod; transactionReference: string; paymentProofUrl?: string | undefined }

export const walletApi = {
  getWallet: (agentId: string, signal?: AbortSignal) =>
    apiRequest<Wallet>(`/wallet/agents/${encodeURIComponent(agentId)}`, { signal }),
  getAgentTransactions: async (agentId: string, page = 1, limit = 10, signal?: AbortSignal): Promise<Page<WalletTransaction>> =>
    toPage(await apiRequest(`/wallet/agents/${encodeURIComponent(agentId)}/transactions`, { query: { page, limit }, signal }), page, limit),
  createTopUp: (agentId: string, input: TopUpInput) =>
    apiRequest<TopUpRequest>(`/wallet/agents/${encodeURIComponent(agentId)}/top-ups`, { method: "POST", body: input }),
  // Admin-only — backend must enforce authorisation before production.
  getPendingTopUps: async (page = 1, limit = 10, signal?: AbortSignal): Promise<Page<TopUpRequest>> =>
    toPage(await apiRequest("/wallet/top-ups/pending", { query: { page, limit }, signal }), page, limit),
  approveTopUp: (id: string, remarks?: string) =>
    apiRequest<TopUpRequest>(`/wallet/top-ups/${encodeURIComponent(id)}/approve`, { method: "PATCH", body: remarks ? { remarks } : {} }),
  rejectTopUp: (id: string, remarks: string) =>
    apiRequest<TopUpRequest>(`/wallet/top-ups/${encodeURIComponent(id)}/reject`, { method: "PATCH", body: { remarks } }),
  getAllTransactions: async (page = 1, limit = 10, signal?: AbortSignal): Promise<Page<WalletTransaction>> =>
    toPage(await apiRequest("/wallet/transactions", { query: { page, limit }, signal }), page, limit),
  // NOTE: POST /wallet/agents/:agentId/credit is a development-only direct credit endpoint.
  // It is intentionally NOT exposed in the UI.
};

export function fmtMoney(v: Money | undefined | null, currency = "BDT") {
  if (v === undefined || v === null || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return String(v);
  const s = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  return currency === "BDT" ? `৳ ${s}` : `${currency} ${s}`;
}
export const agentName = (a?: AgentRef, fallbackId?: string) => a?.businessName ?? a?.companyName ?? a?.name ?? fallbackId ?? "—";
export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");
