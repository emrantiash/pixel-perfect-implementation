import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, StatusBadge, agentNav } from "@/components/brand";
import { NoAgent, useCurrentAgent } from "@/components/agent-context";
import { replaceDoc } from "@/lib/mock/agents";

export const Route = createFileRoute("/agent/documents")({
  head: () => ({
    meta: [
      { title: "Verification documents — TripFlyer Agent" },
      { name: "description", content: "Track the review status of your agency documents and replace rejected files." },
      { property: "og:title", content: "Verification documents — TripFlyer" },
      { property: "og:description", content: "Document review status for TripFlyer agents." },
    ],
  }),
  component: Docs,
});

function Docs() {
  const { agent } = useCurrentAgent();
  const [flash, setFlash] = useState<string | null>(null);
  if (!agent) return <AppShell role="Agent" nav={agentNav}><NoAgent /></AppShell>;

  return (
    <AppShell role="Agent" nav={agentNav}>
      <span className="eyebrow">Verification</span>
      <h1 className="mt-1 font-display text-2xl font-bold tracking-tight">Documents</h1>
      {flash && <div role="status" className="mt-4 rounded-2xl bg-sage-soft px-4 py-3 text-sm">{flash}</div>}
      <div className="mt-6 divide-y divide-border rounded-[24px] border border-border bg-surface">
        {agent.documents.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <div className="flex items-center gap-3"><span className="font-medium">{d.label}</span><StatusBadge status={d.status} /></div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">{d.fileName} · v{d.version} · {new Date(d.uploadedAt).toLocaleDateString("en-GB")}</div>
              {d.status === "rejected" && d.reason && (
                <div className="mt-2 rounded-xl bg-clay-soft px-3 py-2 text-sm"><span className="font-medium text-error">Reason: </span>{d.reason}</div>
              )}
            </div>
            {d.status === "rejected" && (
              <label className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-dark">
                Upload replacement
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { replaceDoc(agent.id, d.id, f.name); setFlash(`${d.label} replaced — it's back in the review queue.`); }
                }} />
              </label>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
