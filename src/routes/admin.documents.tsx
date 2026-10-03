import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, StatusBadge } from "@/components/brand";
import { agentStatus, approveDoc, rejectDoc, useAgentsStore, type DocStatus } from "@/lib/mock/agents";

export const Route = createFileRoute("/admin/documents")({
  head: () => ({
    meta: [
      { title: "Document verification — TripFlyer Admin" },
      { name: "description", content: "Review, approve or reject agent verification documents." },
      { property: "og:title", content: "Document verification — TripFlyer Admin" },
      { property: "og:description", content: "Admin review queue for agent documents." },
    ],
  }),
  component: AdminDocs,
});

const adminNav = [{ to: "/admin/documents" as const, label: "Document review" }];

function AdminDocs() {
  const { agents } = useAgentsStore();
  const [filter, setFilter] = useState<DocStatus | "all">("pending");
  const [selected, setSelected] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const visible = agents.filter((a) => filter === "all" || a.documents.some((d) => d.status === filter));
  const agent = agents.find((a) => a.id === selected) ?? visible[0];
  const count = (s: DocStatus) => agents.reduce((n, a) => n + a.documents.filter((d) => d.status === s).length, 0);

  return (
    <AppShell role="Admin" nav={adminNav}>
      <span className="eyebrow">Admin</span>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Document verification</h1>
      <div className="mt-6 flex w-fit gap-1 rounded-2xl border border-border bg-surface p-1">
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
            <button key={a.id} onClick={() => setSelected(a.id)}
              className={`w-full rounded-2xl p-4 text-left transition-colors ${agent?.id === a.id ? "bg-clay-soft" : "bg-surface hover:bg-muted"}`}>
              <div className="font-medium">{a.businessName}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">{a.city}<StatusBadge status={agentStatus(a)} /></div>
            </button>
          ))}
        </div>

        {agent && (
          <div className="rounded-[24px] border border-border bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-semibold">{agent.businessName}</h2>
                <div className="mt-1 text-sm text-muted-foreground">{agent.ownerName} · {agent.email} · {agent.phone}</div>
                <div className="text-sm text-muted-foreground">{agent.businessAddress}, {agent.city}</div>
              </div>
              <StatusBadge status={agentStatus(agent)} />
            </div>
            <div className="mt-6 divide-y divide-border">
              {agent.documents.map((d) => (
                <div key={d.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3"><span className="font-medium">{d.label}</span><StatusBadge status={d.status} /></div>
                      <div className="mt-1 font-mono text-xs text-muted-foreground">{d.fileName} · v{d.version}</div>
                      {d.reason && <div className="mt-1 text-sm text-error">{d.reason}</div>}
                    </div>
                    {d.status === "pending" && rejecting !== d.id && (
                      <div className="flex gap-2">
                        <button onClick={() => { setRejecting(d.id); setReason(""); }} className="rounded-xl border border-input px-3 py-2 text-sm font-medium hover:bg-clay-soft">Reject</button>
                        <button onClick={() => approveDoc(agent.id, d.id)} className="rounded-xl bg-success px-3 py-2 text-sm font-medium text-primary-foreground">Approve</button>
                      </div>
                    )}
                  </div>
                  {rejecting === d.id && (
                    <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); if (reason.trim().length < 5) return; rejectDoc(agent.id, d.id, reason.trim()); setRejecting(null); }}>
                      <input autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason the agent will see (e.g. image is blurry)" className="field" maxLength={300} />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setRejecting(null)} className="rounded-xl px-3 py-2 text-sm text-muted-foreground">Cancel</button>
                        <button disabled={reason.trim().length < 5} className="rounded-xl bg-error px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40">Confirm reject</button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
