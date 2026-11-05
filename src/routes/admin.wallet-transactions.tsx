import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download, Filter, ChevronDown } from "lucide-react";
import { ErrorState, PageHeader, PanelShell, Pager } from "@/components/panel";
import { TransactionsTable } from "@/components/wallet-ui";
import { walletApi } from "@/lib/api/wallet";
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
  component: () => (
    <PanelShell area="admin">
      <AllTx />
    </PanelShell>
  ),
});

function AllTx() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(20);
  const [term, setTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [type, setType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setActiveSearch(term.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [term]);

  const q = useQuery({
    queryKey: ["admin-tx", page, pageSize, activeSearch, type, fromDate, toDate],
    queryFn: async ({ signal }) => {
      if (pageSize === "all") {
        const first = await walletApi.getAllTransactions(
          1,
          100,
          signal,
          activeSearch,
          type,
          fromDate,
          toDate,
        );

        const allItems = [...first.items];
        const total = first.total ?? first.items.length;
        const totalPages = Math.ceil(total / 100);

        for (let currentPage = 2; currentPage <= totalPages; currentPage++) {
          const result = await walletApi.getAllTransactions(
            currentPage,
            100,
            signal,
            activeSearch,
            type,
            fromDate,
            toDate,
          );
          allItems.push(...result.items);
        }

        return {
          ...first,
          items: allItems,
          page: 1,
          limit: total,
          total,
        };
      }

      return walletApi.getAllTransactions(
        page,
        pageSize,
        signal,
        activeSearch,
        type,
        fromDate,
        toDate,
      );
    },
    enabled: isApiConfigured(),
    retry: false,
  });

  const total = q.data?.total;

  const hasNext =
    pageSize !== "all" &&
    (total !== undefined ? page * pageSize < total : (q.data?.items.length ?? 0) === pageSize);

  const transactionTypes = [
    { value: "", label: "All" },
    { value: "CREDIT", label: "Credit" },
    { value: "TICKET_DEBIT", label: "Ticket debit" },
    { value: "REFUND", label: "Refund" },
    { value: "ADJUSTMENT", label: "Adjustment" },
  ];

  async function downloadCsv() {
    const allTransactions = [];
    let exportPage = 1;
    let exportTotal = 0;

    do {
      const result = await walletApi.getAllTransactions(
        exportPage,
        100,
        undefined,
        activeSearch,
        type,
        fromDate,
        toDate,
      );

      allTransactions.push(...result.items);
      exportTotal = result.total ?? result.items.length;
      exportPage++;
    } while (allTransactions.length < exportTotal);

    if (!allTransactions.length) return;

    const headers = [
      "SL",
      "Date",
      "Agent",
      "Type",
      "Amount",
      "Before",
      "After",
      "Booking",
      "Reference",
      "Description",
    ];

    const escapeCsv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = allTransactions.map((t, index) => [
      index + 1,
      t.createdAt,
      t.agent?.companyName ?? t.agent?.businessName ?? t.agent?.name ?? t.agentId,
      t.type,
      t.amount,
      t.balanceBefore,
      t.balanceAfter,
      t.bookingId,
      t.reference,
      t.description,
    ]);

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tripflyer-wallet-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader eyebrow="Finance" title="Wallet transactions" />

      {!isApiConfigured() ? (
        <ErrorState error={null} />
      ) : (
        <>
          {/* Report controls */}
<div className="mb-4 flex flex-wrap items-center justify-end gap-3">
  {/* Rows per page - always visible */}
  <div className="flex items-center gap-2 rounded-lg border border-[#F1D5C6] bg-gradient-to-r from-[#FFF1E8] to-[#FFF9ED] px-3 py-1.5">
          <span className="text-[10px] font-semibold text-[#9B6A55]">
            Rows
          </span>

    <select
      value={pageSize}
      onChange={(e) => {
        setPage(1);
        setPageSize(
          e.target.value === "all" ? "all" : Number(e.target.value),
        );
      }}
   className="cursor-pointer border-0 bg-transparent text-xs font-bold text-[#EA622E] outline-none"
    >
      <option value={10}>10</option>
      <option value={20}>20</option>
      <option value={50}>50</option>
      <option value={100}>100</option>
      <option value="all">All</option>
    </select>
  </div>

  {/* Show / Hide filters */}
  <button
    type="button"
    onClick={() => setShowFilters((prev) => !prev)}
    className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition hover:border-primary/50 hover:text-primary"
  >
    <Filter className="size-4" />
    {/* {showFilters ? "Hide filters" : "Show filters"} */}
    <ChevronDown
      className={`size-4 transition-transform ${
        showFilters ? "rotate-180" : ""
      }`}
    />
  </button>
</div>

{/* Transaction report panel */}
{showFilters && (
  <div className="mb-5 rounded-2xl border border-border bg-surface p-4 sm:p-5">
    {/* Header */}
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h3 className="text-sm font-semibold">Transaction report</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Search and filter wallet transactions
        </p>
      </div>

      <button
        type="button"
        onClick={downloadCsv}
        disabled={!total}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="size-4" />
        Download CSV
      </button>
    </div>

    {/* Search */}
    {/* Search and date filters */}
<div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
  {/* Search */}
  <div className="relative min-w-0">
    <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    <input
      value={term}
      onChange={(e) => setTerm(e.target.value)}
      placeholder="Search transaction ID, agent, reference, booking or description..."
      className="field h-10 w-full pl-10"
    />
  </div>

  {/* From Date */}
  <div className="min-w-0">
    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
      From Date
    </label>
    <input
      type="date"
      value={fromDate}
      max={toDate || undefined}
      onChange={(e) => {
        setFromDate(e.target.value);
        setPage(1);
      }}
      className="field h-10 w-full"
    />
  </div>

  {/* To Date */}
  <div className="min-w-0">
    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
      To Date
    </label>
    <input
      type="date"
      value={toDate}
      min={fromDate || undefined}
      onChange={(e) => {
        setToDate(e.target.value);
        setPage(1);
      }}
      className="field h-10 w-full"
    />
  </div>

  {/* Clear Dates */}
  {(fromDate || toDate) && (
    <button
      type="button"
      onClick={() => {
        setFromDate("");
        setToDate("");
        setPage(1);
      }}
      className="h-10 whitespace-nowrap rounded-lg border border-border px-4 text-xs font-medium text-muted-foreground transition hover:bg-muted"
    >
      Clear dates
    </button>
  )}
</div>

    {/* Transaction type */}
    <div className="mt-5 border-t border-border pt-4">
      <p className="mb-2.5 text-xs font-medium text-muted-foreground">
        Transaction type
      </p>

      <div className="flex flex-wrap gap-2">
        {transactionTypes.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setType(item.value);
              setPage(1);
            }}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              type === item.value
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  </div>
)}

          {/* Result count */}
          <div className="mb-2 flex justify-between">
            <p></p>
            {/* <p className="text-xs text-muted-foreground">
              {activeSearch || type || fromDate || toDate
                ? `${total ?? 0} matching transactions`
                : "All wallet transactions"}
            </p> */}

            <p className="text-xs text-muted-foreground">
              Showing {q.data?.items.length ?? 0} of {total ?? 0} transactions
            </p>
          </div>

          <TransactionsTable q={q} showAgent />

          {pageSize !== "all" && <Pager page={page} hasNext={hasNext} onPage={setPage} />}
        </>
      )}
    </>
  );
}
