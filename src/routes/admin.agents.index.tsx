import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Search } from "lucide-react";
import { StatusBadge } from "@/components/brand";
import { EmptyState, PageHeader, PanelShell, Pager, td, th } from "@/components/panel";
import { REQUIRED_DOCS } from "@/lib/mock/agents";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import endpoint from "@/utils/path";

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
  component: () => (
    <PanelShell area="admin">
      <Agents />
    </PanelShell>
  ),
});

interface BackendAgent {
  id: string;
  companyName: string;
  businessType: string;
  address: string;
  country: string;
  city: string;
  currency: string;
  verificationStatus: string;
  verificationRemarks?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    role: string;
    status: string;
  };
  documents: Array<{ id: string; status?: string }>;
}

function mapVerificationStatus(status: string) {
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "approved" as const;
    case "REJECTED":
      return "Rejected" as const;
    case "PENDING":
      return "pending" as const;
    default:
      return "not_submitted" as const;
  }
}

function Agents() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "all">(20);
  const [statusFilter, setStatusFilter] = useState<"APPROVED" | "PENDING" | "REJECTED" | "ALL">(
    "APPROVED",
  );

  const apiConfigured = isApiConfigured();

  const {
    data: agents = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "agents"],
    queryFn: ({ signal }) => apiRequest<BackendAgent[]>(endpoint.GetALLAgent, { signal }),
    enabled: apiConfigured,
    retry: false,
  });

  const term = q.trim().toLowerCase();

  const list = agents.filter((a) => {
    const ownerName = `${a.user.firstName} ${a.user.lastName}`.trim();

    const matchesSearch =
      !term ||
      [a.companyName, ownerName, a.user.email, a.user.phone ?? "", a.city].some((value) =>
        value.toLowerCase().includes(term),
      );

    const matchesStatus =
      statusFilter === "ALL" || a.verificationStatus.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const rows = pageSize === "all" ? list : list.slice((page - 1) * pageSize, page * pageSize);

  const downloadCSV = () => {
    const headers = [
      "Agency",
      "Business Type",
      "Owner",
      "Email",
      "Phone",
      "City",
      "Country",
      "Currency",
      "Documents Submitted",
      "Verification Status",
      "Verification Remarks",
      "Registered Date",
    ];

    const escapeCSV = (value: unknown) => {
      let text = String(value ?? "");

      // Protect spreadsheet users from CSV formula injection.
      if (/^[\s]*[=+\-@]/.test(text)) {
        text = `'${text}`;
      }

      return `"${text.replace(/"/g, '""')}"`;
    };

    const csvRows = list.map((a) => [
      a.companyName,
      a.businessType,
      `${a.user.firstName} ${a.user.lastName}`.trim(),
      a.user.email,
      a.user.phone,
      a.city,
      a.country,
      a.currency,
      `${a.documents.length}/${REQUIRED_DOCS.length}`,
      a.verificationStatus,
      a.verificationRemarks,
      a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-GB") : "",
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...csvRows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "tripflyer-agents.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Agents"
        description="Manage registered travel agencies and review their verification status."
      />

      <div className="mb-5 flex flex-col gap-4 rounded-[20px] border border-border bg-surface p-4 sm:p-5">
        {/* Search + Table actions */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search agency, owner, email or city..."
              className="h-11 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground/70 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          {/* Rows per page + Download */}
          <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
            <div className="flex items-center gap-2">
              <label className="whitespace-nowrap text-sm text-muted-foreground">
                Rows per page
              </label>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPage(1);
                  setPageSize(e.target.value === "all" ? "all" : Number(e.target.value));
                }}
                className="h-11 min-w-[90px] cursor-pointer rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground outline-none transition hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">All</option>
              </select>
            </div>

            <button
              type="button"
              onClick={downloadCSV}
              disabled={list.length === 0}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="size-4" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Verification status filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Status
          </span>

          {(
            [
              { label: "Approved", value: "APPROVED" },
              { label: "Pending", value: "PENDING" },
              { label: "Rejected", value: "REJECTED" },
              { label: "All agents", value: "ALL" },
            ] as const
          ).map((item) => {
            const active = statusFilter === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setStatusFilter(item.value);
                  setPage(1);
                }}
                className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground"
                }`}
              >
                {active && <span className="size-1.5 rounded-full bg-primary" />}
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {!apiConfigured ? (
        <div className="rounded-xl border border-border bg-surface p-5 text-sm">
          Backend API is not configured. Check
          <code className="mx-1">VITE_API_BASE_URL</code>
          in your frontend <code>.env.local</code> file.
        </div>
      ) : isLoading ? (
        <div className="mt-5 rounded-xl border border-border bg-surface p-5">
          Loading agents from the backend…
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-destructive">
            Could not load agents: {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded-xl border border-input px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title={term ? "No agents found" : "No agents registered yet"} />
      ) : (
        <div className="mt-10 overflow-x-auto rounded-[20px] border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className={`${th} w-16`}>SL</th>
                <th className={th}>Agency</th>
                <th className={th}>Owner / contact</th>
                <th className={th}>Documents</th>
                <th className={th}>Verification</th>
                <th className={th} />
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {rows.map((a, index) => {
                const ownerName = `${a.user.firstName} ${a.user.lastName}`.trim();

                return (
                  <tr key={a.id}>
                    <td className={`${td} font-mono text-xs text-muted-foreground`}>
                      {pageSize === "all" ? index + 1 : (page - 1) * pageSize + index + 1}
                    </td>

                    <td className={td}>
                      <div className="font-medium">{a.companyName || "Profile incomplete"}</div>
                      <div className="text-xs text-muted-foreground">
                        {[a.businessType, a.city].filter(Boolean).join(" · ")}
                      </div>
                    </td>

                    <td className={td}>
                      <div>{ownerName || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.user.email} · {a.user.phone || "—"}
                      </div>
                    </td>

                    <td className={`${td} font-mono text-xs`}>
                      {a.documents.length}/{REQUIRED_DOCS.length} submitted
                    </td>

                    <td className={td}>
                      <StatusBadge status={mapVerificationStatus(a.verificationStatus)} />
                    </td>

                    <td className={`${td} text-right`}>
                      <Link
                        to="/admin/agents/$agentId"
                        params={{ agentId: a.id }}
                        className="rounded-xl border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !isError && pageSize !== "all" && list.length > 0 && (
        <Pager page={page} hasNext={page * pageSize < list.length} onPage={setPage} />
      )}
    </>
  );
}
