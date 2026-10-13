import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, ErrorState, PageHeader, PanelShell, Skeleton } from "@/components/panel";
import { useAgent, useAgentTransactions, useWallet } from "@/components/agent-data";
import { TransactionsTable, WalletNotLinked } from "@/components/wallet-ui";
import { fmtDate, fmtMoney } from "@/lib/api/wallet";

export const Route = createFileRoute("/agent/wallet/")({
  head: () => ({
    meta: [
      { title: "Wallet — TripFlyer Agent" },
      { name: "description", content: "Your TripFlyer agent wallet balance and recent transactions." },
      { property: "og:title", content: "Wallet — TripFlyer Agent" },
      { property: "og:description", content: "Agent wallet balance and transactions." },
    ],
  }),
  component: () => <PanelShell area="agent"><WalletPage /></PanelShell>,
});

function WalletPage() {
  const { session } = useAgent();
  const id = session?.backendAgentId;
  const w = useWallet(id);
  const tx = useAgentTransactions(id, 1, 10);
  return (
    <>
      <PageHeader eyebrow="Finance" title="Wallet" actions={<div className="flex gap-2">
        <Link to="/agent/wallet/transactions" className="rounded-xl border border-input px-4 py-2 text-sm font-medium">All transactions</Link>
        <Link to="/agent/wallet/top-up" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Request top-up</Link>
      </div>} />
      {!id ? <WalletNotLinked /> : w.isPending ? <Skeleton rows={1} /> : w.isError ? <ErrorState error={w.error} onRetry={() => w.refetch()} /> : (
        <Card>
          <div className="eyebrow text-[10px]">Current balance</div>
          <div className="mt-2 font-display text-4xl font-bold">{fmtMoney(w.data.balance, w.data.currency)}</div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">{w.data.currency}{w.data.updatedAt && ` · updated ${fmtDate(w.data.updatedAt)}`}</div>
        </Card>
      )}
      {id && <><h2 className="mt-8 mb-3 font-display text-lg font-semibold">Recent transactions</h2><TransactionsTable q={tx} /></>}
    </>
  );
}
