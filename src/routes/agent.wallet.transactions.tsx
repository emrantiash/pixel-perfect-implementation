import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, PanelShell, Pager } from "@/components/panel";
import { useAgent, useAgentTransactions } from "@/components/agent-data";
import { TransactionsTable, WalletNotLinked } from "@/components/wallet-ui";

export const Route = createFileRoute("/agent/wallet/transactions")({
  head: () => ({
    meta: [
      { title: "Wallet transactions — TripFlyer Agent" },
      { name: "description", content: "Full wallet transaction history for your agency." },
      { property: "og:title", content: "Wallet transactions — TripFlyer" },
      { property: "og:description", content: "Agent wallet transaction history." },
    ],
  }),
  component: () => <PanelShell area="agent"><TxPage /></PanelShell>,
});

function TxPage() {
  const { session } = useAgent();
  const [page, setPage] = useState(1);
  const id = session?.backendAgentId;
  const q = useAgentTransactions(id, page, 20);
  const total = q.data?.total;
  const hasNext = total !== undefined ? page * 20 < total : (q.data?.items.length ?? 0) === 20;
  return (
    <>
      <PageHeader eyebrow="Finance" title="Wallet transactions" />
      {id ? <><TransactionsTable q={q} /><Pager page={page} hasNext={hasNext} onPage={setPage} /></> : <WalletNotLinked />}
    </>
  );
}
