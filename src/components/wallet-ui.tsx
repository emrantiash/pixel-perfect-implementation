import { Link } from "@tanstack/react-router";
import { Wallet as WalletIcon } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { EmptyState, ErrorState, Skeleton, td, th } from "@/components/panel";
import { isApiConfigured, type Page } from "@/lib/api/client";
import { agentName, fmtDate, fmtMoney, type WalletTransaction } from "@/lib/api/wallet";

export function WalletNotLinked() {
  return (
    <EmptyState title="Wallet not linked yet" icon={WalletIcon}>
      {isApiConfigured()
        ? <>Your account isn't linked to a backend agent record yet. In development preview, set the backend agent ID in <Link to="/agent/settings" className="underline">Settings</Link>.</>
        : "The TripFlyer API isn't connected (VITE_API_BASE_URL is not set), so wallet data can't be loaded."}
    </EmptyState>
  );
}

export function TransactionsTable({ q, showAgent, filter }: { q: UseQueryResult<Page<WalletTransaction>>; showAgent?: boolean; filter?: (t: WalletTransaction) => boolean }) {
  if (q.isPending && q.fetchStatus !== "idle") return <Skeleton />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const items = (q.data?.items ?? []).filter(filter ?? (() => true));
  if (!items.length) return <EmptyState title="No transactions">Wallet transactions will appear here once recorded by the backend.</EmptyState>;
  return (
    <div className="overflow-x-auto rounded-[20px] border border-border bg-surface">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="border-b border-border"><tr>
          {showAgent && <th className={th}>ID</th>}
          <th className={th}>Date</th>{showAgent && <th className={th}>Agent</th>}<th className={th}>Type</th>
          <th className={`${th} text-right`}>Amount</th><th className={`${th} text-right`}>Before</th><th className={`${th} text-right`}>After</th>
          <th className={th}>Booking</th><th className={th}>Reference / description</th>{showAgent && <th className={th}>Created by</th>}
        </tr></thead>
        <tbody className="divide-y divide-border">
          {items.map((t) => {
            const c = t.currency ?? "BDT";
            return (
              <tr key={t.id}>
                {showAgent && <td className={`${td} font-mono text-xs`}>{t.id.slice(0, 10)}</td>}
                <td className={`${td} whitespace-nowrap text-muted-foreground`}>{fmtDate(t.createdAt)}</td>
                {showAgent && <td className={td}>{agentName(t.agent, t.agentId)}</td>}
                <td className={td}><span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs">{t.type}</span></td>
                <td className={`${td} text-right font-mono`}>{fmtMoney(t.amount, c)}</td>
                <td className={`${td} text-right font-mono text-muted-foreground`}>{fmtMoney(t.balanceBefore, c)}</td>
                <td className={`${td} text-right font-mono`}>{fmtMoney(t.balanceAfter, c)}</td>
                <td className={`${td} font-mono text-xs`}>{t.bookingId ?? "—"}</td>
                <td className={td}><div className="font-mono text-xs">{t.reference ?? "—"}</div><div className="text-xs text-muted-foreground">{t.description}</div></td>
                {showAgent && <td className={`${td} text-xs`}>{t.createdBy ?? "—"}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
