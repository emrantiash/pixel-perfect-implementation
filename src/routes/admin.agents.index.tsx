import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { StatusBadge } from "@/components/brand";
import { EmptyState, PageHeader, PanelShell, Pager, td, th } from "@/components/panel";
import { REQUIRED_DOCS, docsUploaded, useAgentsStore, verificationStatus } from "@/lib/mock/agents";

export const Route = createFileRoute("/admin/agents/")({
  head: () => ({
    meta: [
      { title: "Agents — TripFlyer Admin" },
      { name: "description", content: "Search and manage TripFlyer travel agencies." },
      { property: "og:title", content: "Agents — TripFlyer Admin" },
      { property: "og:description", content: "Agent management for TripFlyer administrators." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <PanelShell area="admin"><Agents /></PanelShell>,
});

const PER = 10;
function Agents() {
  const { agents } = useAgentsStore();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const term = q.trim().toLowerCase();
  const list = agents.filter((a) => !term || [a.business.name, a.ownerName, a.email, a.phone, a.business.city].some((v) => v.toLowerCase().includes(term)));
  const rows = list.slice((page - 1) * PER, page * PER);
  return (
    <>
      <PageHeader eyebrow="Admin" title="Agents" description="Development preview data — the agent management API is not available yet." />
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search agency, owner, email, city" className="field pl-9" />
      </div>
      {rows.length === 0 ? <EmptyState title="No agents found" /> : (
        <div className="overflow-x-auto rounded-[20px] border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border"><tr><th className={th}>Agency</th><th className={th}>Owner / contact</th><th className={th}>Documents</th><th className={th}>Verification</th><th className={th} /></tr></thead>
            <tbody className="divide-y divide-border">
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className={td}><div className="font-medium">{a.business.name || "Profile incomplete"}{a.demo && <span className="ml-2 rounded bg-muted px-1.5 font-mono text-[10px]">DEMO</span>}</div><div className="text-xs text-muted-foreground">{[a.business.type, a.business.city].filter(Boolean).join(" · ")}</div></td>
                  <td className={td}><div>{a.ownerName}</div><div className="text-xs text-muted-foreground">{a.email} · {a.phone}</div></td>
                  <td className={`${td} font-mono text-xs`}>{docsUploaded(a)}/{REQUIRED_DOCS.length} submitted</td>
                  <td className={td}><StatusBadge status={verificationStatus(a)} /></td>
                  <td className={`${td} text-right`}><Link to="/admin/agents/$agentId" params={{ agentId: a.id }} className="rounded-xl border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted">Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} hasNext={page * PER < list.length} onPage={setPage} />
    </>
  );
}
