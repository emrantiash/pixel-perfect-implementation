import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { ErrorState, PageHeader, PanelShell, Pager } from "@/components/panel";
import { TransactionsTable } from "@/components/wallet-ui";
import { walletApi, agentName } from "@/lib/api/wallet";
import { isApiConfigured } from "@/lib/api/client";

export const Route = createFileRoute("/admin/wallet-transactions")({
  head: () => ({
    meta: [
      { title: "Wallet transactions — TripFlyer Admin" },
      { name: "description", content: "All agent wallet transactions across TripFlyer." },
      { property: "og:title", content: "Wallet transactions — TripFlyer Admin" },
      { property: "og:description", content: "Admin wallet transaction history." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <PanelShell area="admin"><AllTx /></PanelShell>,
});

const PER = 20;
function AllTx() {
  const [page, setPage] = useState(1);
  const [term, setTerm] = useState("");
  const [type, setType] = useState("");
  const q = useQuery({ queryKey: ["admin-tx", page, PER], queryFn: ({ signal }) => walletApi.getAllTransactions(page, PER, signal), enabled: isApiConfigured(), retry: false });
  const types = [...new Set((q.data?.items ?? []).map((t) => t.type))];
  const s = term.trim().toLowerCase();
  const hasNext = q.data?.total !== undefined ? page * PER < q.data.total : (q.data?.items.length ?? 0) === PER;
  return (
    <>
      <PageHeader eyebrow="Finance" title="Wallet transactions" />
      {!isApiConfigured() ? <ErrorState error={null} /> : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search ID, agent, reference, booking" className="field pl-9" />
            </div>
            <select value={type} onChange={(e) => setType(e.target.value)} className="field w-auto"><option value="">All types</option>{types.map((t) => <option key={t}>{t}</option>)}</select>
            <span className="text-xs text-muted-foreground">Filters apply to the current page.</span>
          </div>
          <TransactionsTable q={q} showAgent filter={(t) => (!type || t.type === type) && (!s || [t.id, agentName(t.agent, t.agentId), t.reference, t.bookingId, t.description].some((v) => v?.toLowerCase().includes(s)))} />
          <Pager page={page} hasNext={hasNext} onPage={setPage} />
        </>
      )}
    </>
  );
}
