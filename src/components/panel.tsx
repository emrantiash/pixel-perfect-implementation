import { Link, type LinkProps } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  AlertTriangle, BadgeCheck, FileText, Inbox, LayoutDashboard, Loader2, LogOut, Plane, Receipt,
  Settings, ShieldCheck, Ticket, User, Users, Wallet, type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand";
import { signOut, useSession, type Role } from "@/lib/auth";
import { errorMessage, isApiConfigured } from "@/lib/api/client";
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type NavItem = { to: LinkProps["to"]; label: string; icon: LucideIcon };
export const agentNav: NavItem[] = [
  { to: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agent/profile", label: "Profile", icon: User },
  { to: "/agent/documents", label: "Documents", icon: FileText },
  { to: "/agent/wallet", label: "Wallet", icon: Wallet },
  { to: "/agent/flights", label: "Flights", icon: Plane },
  { to: "/agent/bookings", label: "Bookings", icon: Ticket },
  { to: "/agent/settings", label: "Settings", icon: Settings },
];
export const adminNav: NavItem[] = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/agents", label: "Agents", icon: Users },
  { to: "/admin/agent-verification", label: "Verification", icon: ShieldCheck },
  { to: "/admin/wallet-top-ups", label: "Top-ups", icon: BadgeCheck },
  { to: "/admin/wallet-transactions", label: "Transactions", icon: Receipt },
  { to: "/admin/bookings", label: "Bookings", icon: Ticket },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

/** Front-end gate only — the NestJS backend must enforce authentication and roles. */
export function PanelShell({ area, children }: { area: Role; children: ReactNode }) {
  const session = useSession();
  const nav = area === "agent" ? agentNav : adminNav;
  if (!session || session.role !== area) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="w-full max-w-md rounded-[24px] border border-border bg-surface p-8 text-center">
          <Logo />
          <h1 className="mt-6 font-display text-2xl font-bold">{session ? "No access to this area" : "Sign in required"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {session ? `You're signed in as ${session.role}. This area is for ${area}s.` : `Sign in with your ${area} account to continue.`}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link to={area === "agent" ? "/agent/sign-in" : "/admin/sign-in"} className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background">{area === "agent" ? "Agent sign in" : "Admin sign in"}</Link>
            {session && <button onClick={signOut} className="rounded-xl border border-input px-4 py-2 text-sm font-medium">Sign out</button>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 z-40 border-b border-border bg-surface px-4 py-3 md:flex md:h-screen md:flex-col md:border-b-0 md:border-r md:p-5">
        <div className="flex items-center justify-between"><Logo /><span className="eyebrow md:hidden">{area}</span></div>
        <div className="eyebrow mt-8 mb-2 hidden md:block">{area === "agent" ? "Agent panel" : "Admin panel"}</div>
        <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-1 md:mx-0 md:mt-0 md:flex-col md:overflow-visible">
          {nav.map((n) => (
            <Link key={String(n.to)} to={n.to as string}
              className="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-clay-soft text-foreground" }}>
              <n.icon className="size-4" />{n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden border-t border-border pt-4 md:block">
          <div className="truncate text-sm font-medium">{session.name}</div>
          <div className="truncate text-xs text-muted-foreground">{session.email}</div>
          <button onClick={signOut} className="mt-3 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><LogOut className="size-4" />Sign out</button>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-8">
        {session.devPreview && (
          <div className="mb-6 flex items-start gap-2 rounded-2xl border border-warning/40 bg-sand-soft px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <span><b>Development preview.</b> You are not securely signed in — Clerk is not connected yet. Agent profile and document data on this device is local preview data only.</span>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[20px] border border-border bg-surface p-5 ${className}`}>{children}</div>;
}

export function EmptyState({ title, children, icon: Icon = Inbox }: { title: string; children?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="rounded-[20px] border border-dashed border-border bg-surface p-8 text-center">
      <Icon className="mx-auto size-6 text-muted-foreground" />
      <div className="mt-3 font-medium">{title}</div>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function PendingIntegration({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-[20px] border border-dashed border-border bg-surface p-6">
      <span className="eyebrow">Integration pending</span>
      <div className="mt-2 font-medium">{title}</div>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const notConfigured = !isApiConfigured();
  return (
    <div role="alert" className="rounded-[20px] border border-error/30 bg-clay-soft p-5 text-sm">
      <div className="flex items-center gap-2 font-medium"><AlertTriangle className="size-4 text-error" />{notConfigured ? "Backend not connected" : "Couldn't load data"}</div>
      <p className="mt-1 text-muted-foreground">{notConfigured ? "Set VITE_API_BASE_URL to the TripFlyer API to load live data." : errorMessage(error)}</p>
      {onRetry && !notConfigured && <button onClick={onRetry} className="mt-3 rounded-xl border border-input bg-surface px-3 py-1.5 text-sm font-medium">Try again</button>}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />)}
    </div>
  );
}

export function Spinner() { return <Loader2 className="size-4 animate-spin" />; }

export function Pager({ page, hasNext, onPage }: { page: number; hasNext: boolean; onPage: (p: number) => void }) {
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="rounded-xl border border-input px-3 py-1.5 disabled:opacity-40">Previous</button>
      <span className="font-mono text-xs text-muted-foreground">Page {page}</span>
      <button disabled={!hasNext} onClick={() => onPage(page + 1)} className="rounded-xl border border-input px-3 py-1.5 disabled:opacity-40">Next</button>
    </div>
  );
}

/** Confirmation dialog for sensitive actions; stays open while the async action runs. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, tone = "primary", onConfirm, children, disabled }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; description: ReactNode; confirmLabel: string;
  tone?: "primary" | "danger"; onConfirm: () => Promise<void>; children?: ReactNode; disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async () => {
    if (busy) return;
    setBusy(true); setErr(null);
    try { await onConfirm(); onOpenChange(false); } catch (e) { setErr(errorMessage(e)); } finally { setBusy(false); }
  };
  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && (setErr(null), onOpenChange(o))}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">{title}</AlertDialogTitle>
          <AlertDialogDescription asChild><div>{description}</div></AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {err && <div role="alert" className="rounded-xl bg-clay-soft px-3 py-2 text-sm text-error">{err}</div>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <button onClick={run} disabled={busy || disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50 ${tone === "danger" ? "bg-error" : "bg-success"}`}>
            {busy && <Spinner />}{confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const th = "px-4 py-3 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground";
export const td = "px-4 py-3 align-top";
