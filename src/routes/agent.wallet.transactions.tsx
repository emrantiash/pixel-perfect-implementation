import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  component: () => (
    <PanelShell area="agent">
      <TxPage />
    </PanelShell>
  ),
});

function TxPage() {
  const { session } = useAgent();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const id = session?.backendAgentId;
  const q = useAgentTransactions(id, page, 20, activeSearch);

  const total = q.data?.total;
  const hasNext = total !== undefined ? page * 20 < total : (q.data?.items.length ?? 0) === 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setActiveSearch(searchInput.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);
  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPage(1);
    setActiveSearch(searchInput.trim());
  }

  function handleClear() {
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
  }

  return (
    <>
      <PageHeader eyebrow="Finance" title="Wallet transactions" />

      {id ? (
        <>
          <div className="mb-5">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search reference, description or type..."
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {activeSearch && (
            <p className="mb-3 text-sm text-muted-foreground">
              Search results for: <strong>{activeSearch}</strong>
              {total !== undefined ? ` (${total} found)` : ""}
            </p>
          )}

          <TransactionsTable q={q} />
          <Pager page={page} hasNext={hasNext} onPage={setPage} />
        </>
      ) : (
        <WalletNotLinked />
      )}
    </>
  );
}
