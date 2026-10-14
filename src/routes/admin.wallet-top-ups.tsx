import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { StatusBadge } from "@/components/brand";
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, PanelShell, Pager, Skeleton, td, th } from "@/components/panel";
import { agentName, fmtDate, fmtMoney, methodLabel, walletApi, type TopUpRequest } from "@/lib/api/wallet";
import { isApiConfigured } from "@/lib/api/client";

export const Route = createFileRoute("/admin/wallet-top-ups")({
  head: () => ({
    meta: [
      { title: "Wallet top-ups — TripFlyer Admin" },
      { name: "description", content: "Review and approve or reject pending agent wallet top-up requests." },
      { property: "og:title", content: "Wallet top-ups — TripFlyer Admin" },
      { property: "og:description", content: "Pending wallet top-up review queue." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <PanelShell area="admin"><TopUps /></PanelShell>,
});

const PER = 10;
function TopUps() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState<TopUpRequest | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [remarks, setRemarks] = useState("");
  const q = useQuery({ queryKey: ["topups-pending", page, PER], queryFn: ({ signal }) => walletApi.getPendingTopUps(page, PER, signal), enabled: isApiConfigured(), retry: false });
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["topups-pending"] }), qc.invalidateQueries({ queryKey: ["admin-tx"] }), qc.invalidateQueries({ queryKey: ["wallet"] })]);
  const items = q.data?.items ?? [];
  const hasNext = q.data?.total !== undefined ? page * PER < q.data.total : items.length === PER;

  return (
    <>
      <PageHeader eyebrow="Finance" title="Wallet top-up review" description="Wallet payment verification — separate from agent document verification. Balances update only after the backend confirms." />
      {!isApiConfigured() || q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} />
        : q.isPending ? <Skeleton />
        : items.length === 0 ? <EmptyState title="No pending top-ups">New requests from agents will appear here.</EmptyState>
        : (
          <div className="overflow-x-auto rounded-[20px] border border-border bg-surface">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-border"><tr><th className={th}>Requested</th><th className={th}>Agent</th><th className={`${th} text-right`}>Amount</th><th className={th}>Method</th><th className={th}>Reference</th><th className={th}>Proof</th><th className={th}>Status</th><th className={th} /></tr></thead>
              <tbody className="divide-y divide-border">
                {items.map((t) => (
                  <tr key={t.id}>
                    <td className={`${td} whitespace-nowrap text-muted-foreground`}>{fmtDate(t.createdAt)}</td>
                    <td className={td}><div className="font-medium">{agentName(t.agent, t.agentId)}</div>{t.agent?.email && <div className="text-xs text-muted-foreground">{t.agent.email}</div>}</td>
                    <td className={`${td} text-right font-mono`}>{fmtMoney(t.amount, t.currency)}</td>
                    <td className={td}>{methodLabel(t.paymentMethod)}</td>
                    <td className={`${td} font-mono text-xs`}>{t.transactionReference ?? "—"}</td>
                    <td className={td}>{t.paymentProofUrl ? <a href={t.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-primary-dark underline">View</a> : "—"}</td>
                    <td className={td}><StatusBadge status={t.status} /></td>
                    <td className={`${td} whitespace-nowrap text-right`}>
                      <button onClick={() => { setSel(t); setRemarks(""); setAction("reject"); }} className="mr-2 rounded-xl border border-input px-3 py-1.5 text-sm font-medium hover:bg-clay-soft">Reject</button>
                      <button onClick={() => { setSel(t); setRemarks(""); setAction("approve"); }} className="rounded-xl bg-success px-3 py-1.5 text-sm font-medium text-primary-foreground">Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      {items.length > 0 && <Pager page={page} hasNext={hasNext} onPage={setPage} />}

      <ConfirmDialog open={action === "approve" && !!sel} onOpenChange={(o) => !o && setAction(null)} title="Approve top-up and credit wallet?"
        description={sel && <>Credit <b>{fmtMoney(sel.amount, sel.currency)}</b> to <b>{agentName(sel.agent, sel.agentId)}</b> (ref {sel.transactionReference ?? "—"}). Confirm you've verified the payment was received.</>}
        confirmLabel="Approve & credit" onConfirm={async () => { await walletApi.approveTopUp(sel!.id, remarks.trim() || undefined); await refresh(); toast.success("Top-up approved by backend"); }}>
        <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} maxLength={300} placeholder="Remarks (optional)" className="field" />
      </ConfirmDialog>
      <ConfirmDialog open={action === "reject" && !!sel} onOpenChange={(o) => !o && setAction(null)} title="Reject top-up request?" tone="danger"
        description="No wallet credit will be made. The agent will see your remarks." confirmLabel="Reject request" disabled={remarks.trim().length < 5}
        onConfirm={async () => { await walletApi.rejectTopUp(sel!.id, remarks.trim()); await refresh(); toast.success("Top-up rejected"); }}>
        <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} maxLength={300} placeholder="Reason (min 5 characters)" className="field" />
      </ConfirmDialog>
    </>
  );
}
