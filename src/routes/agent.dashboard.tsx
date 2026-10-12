import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/brand";
import { Card, PageHeader, PanelShell, PendingIntegration, Skeleton, ErrorState } from "@/components/panel";
import { useAgent, useAgentTransactions, useWallet } from "@/components/agent-data";
import { TransactionsTable, WalletNotLinked } from "@/components/wallet-ui";
import { fmtMoney } from "@/lib/api/wallet";
import { businessComplete, docsUploaded, ownerComplete, submitForReview, verificationStatus, REQUIRED_DOCS } from "@/lib/mock/agents";

export const Route = createFileRoute("/agent/dashboard")({
  head: () => ({
    meta: [
      { title: "Agent dashboard — TripFlyer" },
      { name: "description", content: "Your TripFlyer agency overview: onboarding, verification, wallet and bookings." },
      { property: "og:title", content: "Agent dashboard — TripFlyer" },
      { property: "og:description", content: "Agency overview, verification status and wallet." },
    ],
  }),
  component: () => <PanelShell area="agent"><Dashboard /></PanelShell>,
});

function Dashboard() {
  const { session, agent } = useAgent();
  const agentId = session?.backendAgentId;
  const wallet = useWallet(agentId);
  const tx = useAgentTransactions(agentId, 1, 5);
  if (!agent || !session) return <Skeleton />;

  const bOk = businessComplete(agent), oOk = ownerComplete(agent), up = docsUploaded(agent);
  const allDocs = up === REQUIRED_DOCS.length;
  const vs = verificationStatus(agent);
  const canSubmit = bOk && oOk && allDocs && !agent.submittedAt;
  const profilePct = Math.round(((+bOk + +oOk) / 2) * 100);
  const approved = agent.documents.filter((d) => d.status === "approved").length;

  const steps = [
    { done: bOk, title: "Business profile", desc: "Agency name, type, address and currency", to: "/agent/profile" as const },
    { done: oOk, title: "Owner information", desc: "Designation and NID details", to: "/agent/profile" as const },
    { done: allDocs, title: "Required documents", desc: `${up} of ${REQUIRED_DOCS.length} uploaded`, to: "/agent/documents" as const },
    { done: !!agent.submittedAt, title: "Review and submit", desc: agent.submittedAt ? "Submitted for review" : "Submit once everything above is complete", to: null },
  ];

  return (
    <>
      <PageHeader eyebrow={`Welcome, ${session.name.split(" ")[0]}`} title={agent.business.name || "Your agency"} actions={<StatusBadge status={vs} />} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat k="Profile completion" v={`${profilePct}%`} s={bOk && oOk ? "Complete" : "Incomplete"} />
        <Stat k="Documents submitted" v={`${up}/${REQUIRED_DOCS.length}`} s={`${approved} approved`} />
        <Stat k="Business verification" v={<StatusBadge status={vs} />} s={vs === "approved" ? "Booking unlocked" : "Reviewed by TripFlyer team"} />
        <Stat k="Wallet balance" v={!agentId ? "—" : wallet.isPending ? "…" : wallet.data ? fmtMoney(wallet.data.balance, wallet.data.currency) : "—"}
          s={!agentId ? "Not linked" : wallet.isError ? "Couldn't load" : wallet.data?.currency ?? ""} />
      </div>

      {vs !== "approved" && (
        <Card className="mt-6">
          <h2 className="font-display text-lg font-semibold">Onboarding checklist</h2>
          {vs === "action_required" && <p className="mt-1 text-sm text-error">Some documents were rejected. Re-upload them from Documents.</p>}
          <ol className="mt-4 divide-y divide-border">
            {steps.map((s, i) => (
              <li key={s.title} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-start gap-3">
                  {s.done ? <CheckCircle2 className="mt-0.5 size-5 text-success" /> : <Circle className="mt-0.5 size-5 text-muted-foreground" />}
                  <div><div className="font-medium"><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span> {s.title}</div><div className="text-sm text-muted-foreground">{s.desc}</div></div>
                </div>
                {s.to ? <Link to={s.to} className="rounded-xl border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted">{s.done ? "Edit" : "Start"}</Link>
                  : !agent.submittedAt && <button disabled={!canSubmit} onClick={() => { submitForReview(agent.id); toast.success("Submitted for review — verification is pending."); }}
                    className="rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-40">Submit</button>}
              </li>
            ))}
          </ol>
          {!agent.submittedAt && (
            <dl className="mt-4 grid gap-2 rounded-2xl bg-background p-4 text-sm sm:grid-cols-2">
              {[["Agency", agent.business.name], ["Type", agent.business.type], ["Address", [agent.business.address, agent.business.city, agent.business.country].filter(Boolean).join(", ")], ["Currency", agent.business.currency]].map(([k, v]) => (
                <div key={k}><dt className="eyebrow text-[10px]">{k}</dt><dd className="font-medium">{v || <span className="text-error">Missing</span>}</dd></div>
              ))}
              <div className="sm:col-span-2"><dt className="eyebrow text-[10px]">Documents</dt>
                <dd className="mt-1 flex flex-wrap gap-2">{agent.documents.map((d) => <span key={d.type} className="flex items-center gap-1 text-xs">{d.label} <StatusBadge status={d.status} /></span>)}</dd></div>
            </dl>
          )}
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Recent wallet transactions</h2><Link to="/agent/wallet/transactions" className="text-sm text-primary-dark">View all</Link></div>
          {agentId ? (wallet.isError ? <ErrorState error={wallet.error} /> : <TransactionsTable q={tx} />) : <WalletNotLinked />}
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Top-ups & bookings</h2>
          <PendingIntegration title="Top-up request history">The backend has no endpoint yet for listing an agent's own top-up requests. Submitted requests show their returned status on the top-up page.</PendingIntegration>
          <PendingIntegration title="Recent bookings">Booking APIs aren't connected yet.</PendingIntegration>
          <Link to="/agent/wallet/top-up" className="inline-block rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background">Request wallet top-up</Link>
        </section>
      </div>
    </>
  );
}

function Stat({ k, v, s }: { k: string; v: React.ReactNode; s: string }) {
  return (
    <Card>
      <div className="eyebrow text-[10px]">{k}</div>
      <div className="mt-2 font-display text-2xl font-bold">{v}</div>
      <div className="text-xs text-muted-foreground">{s}</div>
    </Card>
  );
}
