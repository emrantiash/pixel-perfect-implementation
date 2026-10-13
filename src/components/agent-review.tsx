import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/brand";
import { ConfirmDialog } from "@/components/panel";
import { approveDoc, rejectDoc, verificationStatus, type Agent, type DocType } from "@/lib/mock/agents";

/** Agent document review panel (development preview — document verification API pending). */
export function AgentReview({ agent }: { agent: Agent }) {
  const [rejecting, setRejecting] = useState<DocType | null>(null);
  const [approving, setApproving] = useState<DocType | null>(null);
  const [reason, setReason] = useState("");
  const doc = (t: DocType | null) => agent.documents.find((d) => d.type === t);

  return (
    <div className="rounded-[24px] border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">{agent.business.name || "Profile incomplete"}</h2>
          <div className="mt-1 text-sm text-muted-foreground">{agent.ownerName} · {agent.email} · {agent.phone || "—"}</div>
          <div className="text-sm text-muted-foreground">{[agent.business.type, agent.business.address, agent.business.city, agent.business.country].filter(Boolean).join(", ") || "No business details yet"}</div>
          {agent.owner.nidNumber && <div className="mt-1 font-mono text-xs text-muted-foreground">{agent.owner.designation} · NID {agent.owner.nidNumber}</div>}
        </div>
        <StatusBadge status={verificationStatus(agent)} />
      </div>
      {!agent.submittedAt && <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm">The agent hasn't submitted for review yet.</p>}
      <div className="mt-6 divide-y divide-border">
        {agent.documents.map((d) => (
          <div key={d.type} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <div className="flex items-center gap-3"><span className="font-medium">{d.label}</span><StatusBadge status={d.status} /></div>
              {d.fileName && <div className="mt-1 font-mono text-xs text-muted-foreground">{d.fileName} · v{d.version} · file preview unavailable (storage pending)</div>}
              {d.reason && <div className="mt-1 text-sm text-error">Remarks: {d.reason}</div>}
            </div>
            {d.status === "pending" && agent.submittedAt && (
              <div className="flex gap-2">
                <button onClick={() => { setRejecting(d.type); setReason(""); }} className="rounded-xl border border-input px-3 py-2 text-sm font-medium hover:bg-clay-soft">Reject</button>
                <button onClick={() => setApproving(d.type)} className="rounded-xl bg-success px-3 py-2 text-sm font-medium text-primary-foreground">Approve</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <ConfirmDialog open={!!approving} onOpenChange={(o) => !o && setApproving(null)} title={`Approve ${doc(approving)?.label ?? ""}?`}
        description={<>For <b>{agent.business.name}</b>. Development preview — saved on this device only.</>} confirmLabel="Approve"
        onConfirm={async () => { approveDoc(agent.id, approving!); toast.success("Document approved"); }} />
      <ConfirmDialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)} title={`Reject ${doc(rejecting)?.label ?? ""}?`} tone="danger"
        description="The agent will see these remarks and can re-upload." confirmLabel="Reject document" disabled={reason.trim().length < 5}
        onConfirm={async () => { rejectDoc(agent.id, rejecting!, reason.trim()); toast.success("Document rejected"); }}>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} placeholder="Reason (min 5 characters), e.g. scan is blurry" className="field" />
      </ConfirmDialog>
    </div>
  );
}
