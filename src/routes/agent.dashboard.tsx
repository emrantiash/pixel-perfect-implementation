import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, StatusBadge, agentNav } from "@/components/brand";
import { NoAgent, useCurrentAgent } from "@/components/agent-context";
import { agentStatus } from "@/lib/mock/agents";

export const Route = createFileRoute("/agent/dashboard")({
  head: () => ({
    meta: [
      { title: "Agent dashboard — TripFlyer" },
      { name: "description", content: "Your TripFlyer agency overview: verification status, wallet and bookings." },
      { property: "og:title", content: "Agent dashboard — TripFlyer" },
      { property: "og:description", content: "Agency overview, verification status and bookings." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { agent } = useCurrentAgent();
  if (!agent) return <AppShell role="Agent" nav={agentNav}><NoAgent /></AppShell>;
  const status = agentStatus(agent);
  const rejected = agent.documents.filter((d) => d.status === "rejected");
  const approved = agent.documents.filter((d) => d.status === "approved").length;

  return (
    <AppShell role="Agent" nav={agentNav}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Welcome back</span>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">{agent.businessName}</h1>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className={`mt-6 rounded-[24px] p-6 ${status === "approved" ? "bg-sage-soft" : status === "action_required" ? "bg-clay-soft" : "bg-sand-soft"}`}>
        <div className="font-display text-lg font-semibold">
          {status === "approved" ? "Your agency is verified" : status === "action_required" ? "Some documents need your attention" : "Verification in progress"}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {status === "approved" ? "You can now book flights, use your wallet and earn commission."
            : status === "action_required" ? `${rejected.length} document${rejected.length > 1 ? "s were" : " was"} rejected. Replace ${rejected.length > 1 ? "them" : "it"} to continue verification.`
            : "Our team usually reviews documents within one business day. Booking unlocks once approved."}
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(approved / agent.documents.length) * 100}%` }} />
        </div>
        <div className="mt-2 font-mono text-xs text-muted-foreground">{approved} of {agent.documents.length} documents approved</div>
        {status !== "approved" && <Link to="/agent/documents" className="mt-4 inline-block rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background">View documents</Link>}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[["Wallet balance", "৳ 0", "Available after approval"], ["Bookings this month", "0", "—"], ["Commission earned", "৳ 0", "—"]].map(([k, v, s]) => (
          <div key={k} className="rounded-[20px] border border-border bg-surface p-5">
            <div className="eyebrow text-[10px]">{k}</div>
            <div className="mt-2 font-display text-2xl font-bold">{v}</div>
            <div className="text-xs text-muted-foreground">{s}</div>
          </div>
        ))}
      </div>

      {rejected.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-semibold">Documents requiring attention</h2>
          <div className="mt-3 divide-y divide-border rounded-[20px] border border-border bg-surface">
            {rejected.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-4 p-4">
                <div><div className="font-medium">{d.label}</div><div className="text-sm text-error">{d.reason}</div></div>
                <Link to="/agent/documents" className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Replace</Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppShell>
  );
}
