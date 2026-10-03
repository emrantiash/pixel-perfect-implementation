// Mock agent-verification data layer. Replace these functions with NestJS API calls later.
import { useSyncExternalStore } from "react";

export type DocStatus = "pending" | "approved" | "rejected";
export type AgentStatus = "pending" | "approved" | "action_required";

export const REQUIRED_DOCS = [
  { type: "trade_license", label: "Trade licence" },
  { type: "nid", label: "Owner NID" },
  { type: "tin", label: "TIN certificate" },
  { type: "civil_aviation", label: "Civil Aviation (ATAB) certificate" },
] as const;
export type DocType = (typeof REQUIRED_DOCS)[number]["type"];

export interface AgentDoc {
  id: string;
  type: DocType;
  label: string;
  fileName: string;
  status: DocStatus;
  reason?: string;
  uploadedAt: string;
  version: number;
}
export interface Agent {
  id: string;
  businessName: string;
  businessAddress: string;
  city: string;
  ownerName: string;
  email: string;
  phone: string;
  createdAt: string;
  documents: AgentDoc[];
}

interface State { agents: Agent[]; currentAgentId: string | null }
const KEY = "tripflyer.mock.v1";
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();

function seed(): State {
  const mk = (name: string, owner: string, city: string, statuses: DocStatus[], reason?: string): Agent => ({
    id: uid(),
    businessName: name,
    businessAddress: "House 12, Road 7",
    city,
    ownerName: owner,
    email: owner.split(" ")[0].toLowerCase() + "@" + name.split(" ")[0].toLowerCase() + ".com.bd",
    phone: "+880 17" + Math.floor(10000000 + Math.random() * 89999999),
    createdAt: new Date(Date.now() - Math.random() * 6e8).toISOString(),
    documents: REQUIRED_DOCS.map((d, i) => ({
      id: uid(), type: d.type, label: d.label,
      fileName: d.type + ".pdf", status: statuses[i],
      reason: statuses[i] === "rejected" ? reason : undefined,
      uploadedAt: now(), version: 1,
    })),
  });
  return {
    currentAgentId: null,
    agents: [
      mk("Skyline Tours & Travels", "Rafiqul Islam", "Dhaka", ["pending", "pending", "pending", "pending"]),
      mk("Chattogram Air Express", "Nusrat Jahan", "Chattogram", ["approved", "approved", "rejected", "approved"], "TIN certificate is blurry — please upload a clear scan."),
      mk("Sylhet Wings Ltd", "Tanvir Ahmed", "Sylhet", ["approved", "approved", "approved", "approved"]),
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
const serverSnap = seed();
export function useAgentsStore() {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); l(); return () => listeners.delete(l); },
    () => { load(); return state; },
    () => serverSnap,
  );
}

export function agentStatus(a: Agent): AgentStatus {
  if (a.documents.some((d) => d.status === "rejected")) return "action_required";
  if (a.documents.every((d) => d.status === "approved")) return "approved";
  return "pending";
}

export function registerAgent(input: Omit<Agent, "id" | "createdAt" | "documents"> & { files: Record<DocType, string> }) {
  const { files, ...rest } = input;
  const agent: Agent = {
    ...rest, id: uid(), createdAt: now(),
    documents: REQUIRED_DOCS.map((d) => ({
      id: uid(), type: d.type, label: d.label, fileName: files[d.type],
      status: "pending", uploadedAt: now(), version: 1,
    })),
  };
  set({ agents: [agent, ...state.agents], currentAgentId: agent.id });
  return agent;
}

export function setCurrentAgent(id: string) { set({ ...state, currentAgentId: id }); }

function updateDoc(agentId: string, docId: string, fn: (d: AgentDoc) => AgentDoc) {
  set({
    ...state,
    agents: state.agents.map((a) => a.id !== agentId ? a : { ...a, documents: a.documents.map((d) => d.id === docId ? fn(d) : d) }),
  });
}
export const approveDoc = (agentId: string, docId: string) =>
  updateDoc(agentId, docId, (d) => ({ ...d, status: "approved", reason: undefined }));
export const rejectDoc = (agentId: string, docId: string, reason: string) =>
  updateDoc(agentId, docId, (d) => ({ ...d, status: "rejected", reason }));
export const replaceDoc = (agentId: string, docId: string, fileName: string) =>
  updateDoc(agentId, docId, (d) => ({ ...d, fileName, status: "pending", reason: undefined, uploadedAt: now(), version: d.version + 1 }));
