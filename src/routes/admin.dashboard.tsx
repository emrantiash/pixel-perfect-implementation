import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, PageHeader, PanelShell, PendingIntegration } from "@/components/panel";
import { isApiConfigured } from "@/lib/api/client";
import { walletApi } from "@/lib/api/wallet";
import { apiRequest } from "@/lib/api/client";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin overview — TripFlyer" },
      {
        name: "description",
        content: "TripFlyer operations overview: agents, verification and wallet queues.",
      },
      { property: "og:title", content: "Admin overview — TripFlyer" },
      { property: "og:description", content: "TripFlyer operations overview." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PanelShell area="admin">
      <Overview />
    </PanelShell>
  ),
});

function Overview() {
  const on = isApiConfigured();
  const topups = useQuery({
    queryKey: ["topups-pending", 1, 1],
    queryFn: ({ signal }) => walletApi.getPendingTopUps(1, 1, signal),
    enabled: on,
    retry: false,
  });
  const tx = useQuery({
    queryKey: ["admin-tx", 1, 1],
    queryFn: ({ signal }) => walletApi.getAllTransactions(1, 1, signal),
    enabled: on,
    retry: false,
  });
  const live = (q: typeof topups | typeof tx) =>
    !on
      ? "—"
      : q.isPending
        ? "…"
        : q.isError
          ? "Error"
          : q.data?.total !== undefined
            ? String(q.data.total)
            : q.data && q.data.items.length > 0
              ? "1+"
              : "0";

  const agentsQuery = useQuery({
    queryKey: ["admin", "agents"],
    queryFn: ({ signal }) =>
      apiRequest<
        {
          id: string;
          verificationStatus: string;
        }[]
      >("/users/agents", { signal }),
    enabled: on,
    retry: false,
  });

  const agents = agentsQuery.data ?? [];

  const agentCount = !on
    ? "—"
    : agentsQuery.isPending
      ? "…"
      : agentsQuery.isError
        ? "Error"
        : String(agents.length);

  const pendingVer = !on
    ? "—"
    : agentsQuery.isPending
      ? "…"
      : agentsQuery.isError
        ? "Error"
        : String(
            agents.filter((agent) => {
              const status = agent.verificationStatus.toUpperCase();
              return status === "PENDING" || status === "NEEDS_DOCUMENT";
            }).length,
          );

  return (
    <>
      <PageHeader eyebrow="Admin" title="Operations overview" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          k="Pending wallet top-ups"
          v={live(topups)}
          s={on ? "Live from wallet API" : "API not configured"}
          to="/admin/wallet-top-ups"
        />
        <Metric
          k="Wallet transactions"
          v={live(tx)}
          s={on ? "Live from wallet API" : "API not configured"}
          to="/admin/wallet-transactions"
        />
        <Metric
          k="Agents"
          v={agentCount}
          s={on ? "Live from agent API" : "API not configured"}
          to="/admin/agents"
        />

        <Metric
          k="Pending verification"
          v={pendingVer}
          s={on ? "Live from agent API" : "API not configured"}
          to="/admin/agent-verification"
        />
      </div>
      <div className="mt-6">
        <PendingIntegration title="Booking counts and statuses">
          Booking APIs aren't connected yet.
        </PendingIntegration>
      </div>
    </>
  );
}

function Metric({
  k,
  v,
  s,
  to,
}: {
  k: string;
  v: string;
  s: string;
  to:
    | "/admin/wallet-top-ups"
    | "/admin/wallet-transactions"
    | "/admin/agents"
    | "/admin/agent-verification";
}) {
  return (
    <Link to={to}>
      <Card className="h-full hover:bg-muted">
        <div className="eyebrow text-[10px]">{k}</div>
        <div className="mt-2 font-display text-3xl font-bold">{v}</div>
        <div className="text-xs text-muted-foreground">{s}</div>
      </Card>
    </Link>
  );
}
