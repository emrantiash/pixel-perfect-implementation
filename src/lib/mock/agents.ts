// DEVELOPMENT PREVIEW data layer for agent onboarding & document verification.
// No backend contract exists yet for agent profiles or document review — these functions are
// placeholders to be swapped for NestJS API calls. Files are NOT stored anywhere (only names).
import { useSyncExternalStore } from "react";

export type DocStatus = "not_uploaded" | "pending" | "approved" | "rejected";
export type VerificationStatus = "not_submitted" | "pending" | "action_required" | "approved";

export const REQUIRED_DOCS = [
  { type: "nid", label: "NID" },
  { type: "tin", label: "TIN Certificate" },
  { type: "civil_aviation", label: "Civil Aviation Certificate" },
  { type: "trade_license", label: "Trade License" },
  { type: "owner_photo", label: "Owner's Picture" },
] as const;
export type DocType = (typeof REQUIRED_DOCS)[number]["type"];
export const BUSINESS_TYPES = ["Sole proprietorship", "Partnership", "Private limited company", "Public limited company", "Other"] as const;

export interface AgentDoc { type: DocType; label: string; fileName?: string; status: DocStatus; reason?: string; uploadedAt?: string; version: number }
export interface Business { name: string; type: string; address: string; city: string; country: string; currency: string }
export interface Owner { designation: string; nidNumber: string; dateOfBirth: string }
export interface Agent {
  id: string; userId: string; ownerName: string; email: string; phone: string; createdAt: string;
  business: Business; owner: Owner; documents: AgentDoc[]; submittedAt?: string; demo?: boolean;
}

interface State { agents: Agent[] }
const KEY = "tripflyer.mock.v2";
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const emptyDocs = (): AgentDoc[] => REQUIRED_DOCS.map((d) => ({ type: d.type, label: d.label, status: "not_uploaded", version: 0 }));

function seed(): State {
  const mk = (name: string, owner: string, city: string, statuses: DocStatus[], reason?: string): Agent => ({
    id: uid(), userId: "demo_" + uid(), ownerName: owner, demo: true,
    email: (owner.split(" ")[0] ?? "").toLowerCase() + "@example.com",
    phone: "+880 1700 000000", createdAt: now(), submittedAt: now(),
    business: { name, type: "Private limited company", address: "Demo address", city, country: "Bangladesh", currency: "BDT" },
    owner: { designation: "Managing Director", nidNumber: "0000000000", dateOfBirth: "1985-01-01" },
    documents: REQUIRED_DOCS.map((d, i) => ({
      type: d.type, label: d.label, fileName: d.type + ".pdf", status: statuses[i] ?? "pending",
      reason: statuses[i] === "rejected" ? reason : undefined, uploadedAt: now(), version: 1,
    })),
  });
  return {
    agents: [
      mk("Demo Agency A", "Demo Owner A", "Dhaka", ["pending", "pending", "pending", "pending", "pending"]),
      mk("Demo Agency B", "Demo Owner B", "Chattogram", ["approved", "rejected", "approved", "approved", "approved"], "Scan is blurry — please upload a clear copy."),
      mk("Demo Agency C", "Demo Owner C", "Sylhet", ["approved", "approved", "approved", "approved", "approved"]),
    ],
  };
}

let state: State = seed();
let loaded = false;
const listeners = new Set<() => void>();
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = JSON.parse(raw); } catch { /* ignore */ }
}
function set(next: State) {
  state = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}
const serverSnap: State = { agents: [] };
export function useAgentsStore() {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); return () => listeners.delete(l); },
    () => { load(); return state; },
    () => serverSnap,
  );
}
export function useAgentForUser(userId?: string) {
  return useAgentsStore().agents.find((a) => a.userId === userId) ?? null;
}

/** Creates the agent profile only once an authenticated identity exists. */
export function ensureAgentForUser(u: { userId: string; name: string; email: string; phone?: string }) {
  load();
  if (state.agents.some((a) => a.userId === u.userId)) return;
  const agent: Agent = {
    id: uid(), userId: u.userId, ownerName: u.name, email: u.email, phone: u.phone ?? "", createdAt: now(),
    business: { name: "", type: "", address: "", city: "", country: "Bangladesh", currency: "BDT" },
    owner: { designation: "", nidNumber: "", dateOfBirth: "" },
    documents: emptyDocs(),
  };
  set({ agents: [agent, ...state.agents] });
}

const patch = (id: string, fn: (a: Agent) => Agent) => set({ agents: state.agents.map((a) => (a.id === id ? fn(a) : a)) });
export const saveBusiness = (id: string, business: Business) => patch(id, (a) => ({ ...a, business }));
export const saveOwner = (id: string, owner: Owner) => patch(id, (a) => ({ ...a, owner }));
export const submitForReview = (id: string) => patch(id, (a) => ({ ...a, submittedAt: now() }));
const patchDoc = (id: string, type: DocType, fn: (d: AgentDoc) => AgentDoc) =>
  patch(id, (a) => ({ ...a, documents: a.documents.map((d) => (d.type === type ? fn(d) : d)) }));
export const uploadDoc = (id: string, type: DocType, fileName: string) =>
  patchDoc(id, type, (d) => ({ ...d, fileName, status: "pending", reason: undefined, uploadedAt: now(), version: d.version + 1 }));
export const approveDoc = (id: string, type: DocType) => patchDoc(id, type, (d) => ({ ...d, status: "approved", reason: undefined }));
export const rejectDoc = (id: string, type: DocType, reason: string) => patchDoc(id, type, (d) => ({ ...d, status: "rejected", reason }));

export const businessComplete = (a: Agent) => !!(a.business.name && a.business.type && a.business.address && a.business.city && a.business.country && a.business.currency);
export const ownerComplete = (a: Agent) => !!(a.ownerName && a.phone && a.owner.designation && a.owner.nidNumber);
export const docsUploaded = (a: Agent) => a.documents.filter((d) => d.status !== "not_uploaded").length;
export function verificationStatus(a: Agent): VerificationStatus {
  if (!a.submittedAt) return "not_submitted";
  if (a.documents.some((d) => d.status === "rejected")) return "action_required";
  if (a.documents.every((d) => d.status === "approved")) return "approved";
  return "pending";
}
