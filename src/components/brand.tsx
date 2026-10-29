import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { DocStatus, VerificationStatus } from "@/lib/mock/agents";


type LogoProps = {
  to?: "/" | "/agent/dashboard" | "/admin/dashboard";
};

export function Logo({ to = "/" }: LogoProps) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <div className="grid size-8 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground">
        T
      </div>
      <span className="font-display text-lg font-bold tracking-tight">
        TripFlyer
      </span>
    </Link>
  );
}



export function SiteHeader() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/flights" className="hover:text-foreground">Flights</Link>
          <Link to="/agent/register" className="hover:text-foreground">For Agencies</Link>
          <Link to="/admin/dashboard" className="hover:text-foreground">Admin</Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">BDT</span>
          <Link to="/agent/sign-in" className="text-sm font-medium">Agent sign in</Link>
          <Link to="/agent/register" className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-primary-dark">Become an agent</Link>
        </div>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  const col = (title: string, links: [string, ReactNode][]) => (
    <div>
      <div className="eyebrow mb-3">{title}</div>
      <div className="space-y-2">{links.map(([k, l]) => <div key={k}>{l}</div>)}</div>
    </div>
  );
  const a = (t: string) => <span className="cursor-default hover:text-primary-dark">{t}</span>;
  return (
    <footer className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-col justify-between gap-10 md:flex-row">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">The flight booking platform built for Bangladeshi travellers and agencies — calm, precise, always in Taka.</p>
        </div>
        <div className="flex gap-12 text-sm">
          {col("Product", [["s", <Link to="/flights" className="hover:text-primary-dark">Search flights</Link>], ["r", <Link to="/agent/register" className="hover:text-primary-dark">Agent registration</Link>], ["h", a("Help centre")]])}
          {col("Company", [["a", a("About")], ["c", a("Contact")], ["t", a("Terms")], ["p", a("Privacy")]])}
        </div>
      </div>
      <div className="mt-12 flex justify-between border-t border-border pt-6 font-mono text-xs text-muted-foreground">
        <span>© 2026 TripFlyer</span><span>Support · +880 9612 000 000</span>
      </div>
    </footer>
  );
}

type AnyStatus = DocStatus | VerificationStatus | "PENDING" | "APPROVED" | "REJECTED";
const statusMap: Record<AnyStatus, { label: string; cls: string; dot: string }> = {
  not_uploaded: { label: "Not uploaded", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  not_submitted: { label: "Not submitted", cls: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  pending: { label: "Pending review", cls: "bg-sand-soft text-foreground", dot: "bg-warning" },
  PENDING: { label: "Pending", cls: "bg-sand-soft text-foreground", dot: "bg-warning" },
  approved: { label: "Approved", cls: "bg-sage-soft text-foreground", dot: "bg-success" },
  APPROVED: { label: "Approved", cls: "bg-sage-soft text-foreground", dot: "bg-success" },
  rejected: { label: "Rejected", cls: "bg-clay-soft text-foreground", dot: "bg-error" },
  REJECTED: { label: "Rejected", cls: "bg-clay-soft text-foreground", dot: "bg-error" },
  action_required: { label: "Action required", cls: "bg-clay-soft text-foreground", dot: "bg-error" },
};
export function StatusBadge({ status }: { status: AnyStatus | string }) {
  const s = statusMap[status as AnyStatus] ?? { label: status, cls: "bg-muted text-foreground", dot: "bg-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />{s.label}
    </span>
  );
}
