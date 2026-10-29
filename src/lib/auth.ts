import { useSyncExternalStore } from "react";
import { useClerk } from "@clerk/tanstack-react-start";

export type Role = "agent" | "admin";
export interface Session {
  userId: string;
  name: string;
  email: string;
  phone?: string | undefined;
  role: Role;
  /** Backend (NestJS) agent id used for wallet API calls. */
  backendAgentId?: string | undefined;
  devPreview: boolean;
}

export const CLERK_PUBLISHABLE_KEY = import.meta.env["VITE_CLERK_PUBLISHABLE_KEY"] as
  string | undefined;
/** Flip to true once @clerk/clerk-react is installed and wired into signUp/signIn/getToken. */
export const CLERK_INTEGRATED = false;

export class AuthNotConfiguredError extends Error {
  constructor() {
    super("Account sign-up and sign-in aren't connected yet. Clerk integration is pending.");
  }
}

export interface SignUpInput {
  name: string;
  email: string;
  phone: string;
  password: string;
}
export const authAdapter = {
  async signUp(_input: SignUpInput): Promise<never> {
    throw new AuthNotConfiguredError();
  },
  async signIn(_email: string, _password: string): Promise<never> {
    throw new AuthNotConfiguredError();
  },
  async getToken(): Promise<string | null> {
    return null;
  },
};
// setAuthTokenGetter(() => authAdapter.getToken());

const KEY = "tripflyer.devSession.v1";
let session: Session | null = null;
let loaded = false;
const listeners = new Set<() => void>();
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) session = JSON.parse(raw);
  } catch {
    /* ignore */
  }
}
function set(next: Session | null) {
  session = next;
  if (typeof window !== "undefined")
    next ? localStorage.setItem(KEY, JSON.stringify(next)) : localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}
export function useSession() {
  return useSyncExternalStore(
    (l) => {
      load();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => {
      load();
      return session;
    },
    () => null,
  );
}
export function startDevPreview(input: {
  role: Role;
  name: string;
  email: string;
  phone?: string | undefined;
}) {
  set({ ...input, userId: "dev_" + Math.random().toString(36).slice(2, 10), devPreview: true });
}

export function startClerkSession(input: {
  userId: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  backendAgentId?: string;
}) {
  set({
    ...input,
    devPreview: false,
  });
}

export function updateSession(patch: Partial<Pick<Session, "name" | "phone" | "backendAgentId">>) {
  if (session) set({ ...session, ...patch });
}


export function useAppSignOut() {
  const { signOut: clerkSignOut } = useClerk();

  return async () => {
    try {
      await clerkSignOut();
    } finally {
      set(null);
    }
  };
}
