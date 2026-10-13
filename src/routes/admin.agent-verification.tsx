import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBadge } from "@/components/brand";
import { PageHeader, PanelShell } from "@/components/panel";
import { AgentReview } from "@/components/agent-review";
import { useAgentsStore, verificationStatus, type DocStatus } from "@/lib/mock/agents";

export const Route = createFileRoute("/admin/agent-verification")({
  head: () => ({
    meta: [
      { title: "Agent verification — TripFlyer Admin" },
      { name: "description", content: "Review, approve or reject agent verification documents." },
      { property: "og:title", content: "Agent verification — TripFlyer Admin" },
      { property: "og:description", content: "Admin review queue for agent documents." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <PanelShell area="admin"><Queue /></PanelShell>,
});

function Queue() {
  const { agents } = useAgentsStore();
  const [filter, setFilter] = useState<Exclude<DocStatus, "not_uploaded"> | "all">("pending");
  const [selected, setSelected] = useState<string | null>(null);
  const submitted = agents.filter((a) => a.submittedAt);
  const visible = submitted.filter((a) => filter === "all" || a.documents.some((d) => d.status === filter));
  const agent = visible.find((a) => a.id === selected) ?? visible[0];
  const count = (s: DocStatus) => submitted.reduce((n, a) => n + a.documents.filter((d) => d.status === s).length, 0);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Agent verification" description="Business document verification — separate from wallet payment review. Development preview data; the verification API is pending." />
      <div className="flex w-fit flex-wrap gap-1 rounded-2xl border border-border bg-surface p-1">
        {(["pending", "rejected", "approved", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-xl px-3 py-1.5 text-sm font-medium capitalize ${filter === f ? "bg-foreground text-background" : "text-muted-foreground"}`}>
            {f}{f !== "all" && <span className="ml-1 font-mono text-xs opacity-70">{count(f)}</span>}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {visible.length === 0 && <div className="rounded-2xl bg-surface p-6 text-center text-sm text-muted-foreground">Nothing here — queue is clear.</div>}
          {visible.map((a) => (
            <button key={a.id} onClick={() => setSelected(a.id)} className={`w-full rounded-2xl p-4 text-left transition-colors ${agent?.id === a.id ? "bg-clay-soft" : "bg-surface hover:bg-muted"}`}>
              <div className="font-medium">{a.business.name}</div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">{a.business.city}<StatusBadge status={verificationStatus(a)} /></div>
            </button>
          ))}
        </div>
        {agent && <AgentReview agent={agent} />}
      </div>
    </>
  );
}
