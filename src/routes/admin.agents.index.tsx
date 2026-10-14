import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
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

const PER = 10;

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

    return (
      !term ||
      [a.companyName, ownerName, a.user.email, a.user.phone ?? "", a.city].some((value) =>
        value.toLowerCase().includes(term),
      )
    );
  });

  const rows = list.slice((page - 1) * PER, page * PER);

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Agents"
        description="Manage registered travel agencies and review their verification status."
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search agency, owner, email, city"
          className="field pl-9"
        />
      </div>

      {!apiConfigured ? (
        <div className="rounded-xl border border-border bg-surface p-5 text-sm">
          Backend API is not configured. Check
          <code className="mx-1">VITE_API_BASE_URL</code>
          in your frontend <code>.env.local</code> file.
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
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
        <div className="overflow-x-auto rounded-[20px] border border-border bg-surface">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border">
              <tr>
                <th className={th}>Agency</th>
                <th className={th}>Owner / contact</th>
                <th className={th}>Documents</th>
                <th className={th}>Verification</th>
                <th className={th} />
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {rows.map((a) => {
                const ownerName = `${a.user.firstName} ${a.user.lastName}`.trim();

                return (
                  <tr key={a.id}>
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

      {!isLoading && !isError && list.length > 0 && (
        <Pager page={page} hasNext={page * PER < list.length} onPage={setPage} />
      )}
    </>
  );
}
