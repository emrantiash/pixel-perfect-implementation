import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { ErrorState, PageHeader, PanelShell, Pager } from "@/components/panel";
import { AgentReview } from "@/components/agent-review";

type DocStatus = "PENDING" | "APPROVED" | "REJECTED";
type QueueFilter = "pending" | "rejected";

type BackendDocument = {
  id: string;
  type: string;
  documentNumber?: string | null;
  filePath?: string | null;
  fileUrl?: string | null;
  verificationStatus: DocStatus;
  remarks?: string | null;
  createdAt?: string;
};

type BackendAgent = {
  id: string;
  companyName: string;
  businessType?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  currency?: string | null;
  verificationStatus: string;
  verificationRemarks?: string | null;
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
  };
  documents: BackendDocument[];
};

export const Route = createFileRoute("/admin/agent-verification")({
  head: () => ({
    meta: [
      { title: "Agent verification — TripFlyer Admin" },
      {
        name: "description",
        content: "Review, approve or reject agent verification documents.",
      },
      { property: "og:title", content: "Agent verification — TripFlyer Admin" },
      {
        property: "og:description",
        content: "Admin review queue for agent documents.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PanelShell area="admin">
      <Queue />
    </PanelShell>
  ),
});

function Queue() {
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [selected, setSelected] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(20);

  const {
    data: agents = [],
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "agents"],
    queryFn: () => apiRequest<BackendAgent[]>("/users/agents"),
  });

  const matchesFilter = (item: BackendAgent, status: QueueFilter) => {
    const agentStatus = item.verificationStatus.toUpperCase();

    if (status === "pending") {
      return agentStatus === "PENDING" || agentStatus === "NEEDS_DOCUMENT";
    }

    return agentStatus === "REJECTED";
  };

  const visible = agents.filter((item) => matchesFilter(item, filter));

  const rows = pageSize === "all" ? visible : visible.slice((page - 1) * pageSize, page * pageSize);

  const agent = rows.find((item) => item.id === selected) ?? rows[0];

  const start =
    rows.length === 0 ? 0 : (page - 1) * (pageSize === "all" ? rows.length : pageSize) + 1;
  const end = pageSize === "all" ? rows.length : Math.min(page * pageSize, visible.length);

  const count = (status: QueueFilter) =>
    agents.filter((item) => matchesFilter(item, status)).length;

  

return (
  <>
    <PageHeader
      eyebrow="Admin"
      title="Agent verification"
      description="Review business profiles and submitted verification documents."
    />

    {/* Verification filters */}
    <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-4">
      <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Verification status
      </span>

      {(
        [
          { label: "Pending", value: "pending" },
          { label: "Rejected", value: "rejected" },
        ] as const
      ).map((item) => {
        const active = filter === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => {
              setFilter(item.value);
              setPage(1);
              setSelected(null);
            }}
            className={`inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-all ${
              active
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground"
            }`}
          >
            {active && <span className="size-1.5 rounded-full bg-primary" />}
            {item.label}
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs">
              {count(item.value)}
            </span>
          </button>
        );
      })}

      {/* Count and rows selector */}
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <span className="whitespace-nowrap text-[10px] font-medium tracking-wide text-muted-foreground">
          {start}–{end} of {visible.length} agents
        </span>

        <div className="flex items-center gap-2 rounded-lg border border-[#F1D5C6] bg-gradient-to-r from-[#FFF1E8] to-[#FFF9ED] px-3 py-1.5">
          <span className="text-[10px] font-semibold text-[#9B6A55]">
            Rows
          </span>

          <select
            value={pageSize}
            onChange={(e) => {
              const value = e.target.value;
              setPageSize(value === "all" ? "all" : Number(value));
              setPage(1);
              setSelected(null);
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
      </div>
    </div>

    {isPending ? (
      <div className="mt-5 rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted-foreground">
        Loading agent verification queue…
      </div>
    ) : isError ? (
      <div className="mt-5 rounded-2xl border border-border bg-surface p-6">
        <p className="text-sm text-error">
          {error instanceof Error
            ? error.message
            : "Could not load agent verification data."}
        </p>

        <button
          type="button"
          onClick={() => {
            setFilter("pending");
            setPage(1);
            setSelected(null);
          }}
          className="mt-4 rounded-xl border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Try again
        </button>
      </div>
    ) : (
      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_1fr]">
        {/* Agent list */}
        <div className="space-y-3">
          {rows.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted-foreground">
              {filter === "pending"
                ? "No agents are waiting for verification."
                : "No rejected agents found."}
            </div>
          )}

          {rows.map((item) => {
            const ownerName = [
              item.user?.firstName,
              item.user?.lastName,
            ]
              .filter(Boolean)
              .join(" ");

            const submittedDocuments = item.documents.length;
            const totalRequiredDocuments = 5;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelected(item.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  agent?.id === item.id
                    ? "border-[#F4D7C8] bg-gradient-to-r from-[#FFF] via-[#FFF7F0] to-[#c0b091] shadow-sm"
                    : "border-border bg-surface hover:border-[#F1D5C6] hover:bg-[#FFFAF7]"
                }`}
              >
                <div className="font-medium">
                  {item.companyName || "Profile incomplete"}
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  {ownerName || item.user?.email || "Owner details unavailable"}
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{item.city || "Location not provided"}</span>

                  <span>
                    {submittedDocuments}/{totalRequiredDocuments} documents submitted
                  </span>
                </div>

                <div className="mt-2">
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                    {item.verificationStatus.replaceAll("_", " ")}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Pagination */}
          {pageSize !== "all" && visible.length > pageSize && (
            <div className="pt-2">
              <Pager
                page={page}
                hasNext={page * pageSize < visible.length}
                onPage={setPage}
              />
            </div>
          )}
        </div>

        {/* Agent review */}
        {agent && <AgentReview key={agent.id} agent={agent} />}
      </div>
    )}
  </>
);


}
