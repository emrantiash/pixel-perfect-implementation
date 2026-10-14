
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, PanelShell, EmptyState } from "@/components/panel";
import { AgentReview } from "@/components/agent-review";
import { apiRequest, isApiConfigured } from "@/lib/api/client";
import endpoint from "@/utils/path";

export const Route = createFileRoute("/admin/agents/$agentId")({
  head: () => ({
    meta: [
      { title: "Agent details — TripFlyer Admin" },
      { name: "description", content: "Agency details and submitted verification documents." },
      { property: "og:title", content: "Agent details — TripFlyer Admin" },
      { property: "og:description", content: "Agency details for TripFlyer administrators." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PanelShell area="admin">
      <Detail />
    </PanelShell>
  ),
});


interface BackendAgent {
  id: string;
  companyName: string;
  businessType?: string | null;
  address?: string | null;
  country?: string | null;
  city?: string | null;
  currency?: string | null;
  verificationStatus: string;
  verificationRemarks?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
  };
  documents: Array<{
    id: string;
    type: string;
    documentNumber?: string | null;
    filePath?: string | null;
    fileUrl?: string | null;
    verificationStatus: string;
    remarks?: string | null;
    createdAt?: string;
  }>;
}

function Detail() {
  const { agentId } = Route.useParams();

  const {
    data: agent,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["admin", "agent", agentId],
    queryFn: ({ signal }) =>
      apiRequest<BackendAgent>(
        endpoint.GetAgentById(agentId),
        { signal },
      ),
    enabled: isApiConfigured() && !!agentId,
    retry: false,
  });

  return (
    <>
      <PageHeader
        eyebrow="Agents"
        title="Agent details"
        actions={
          <Link
            to="/admin/agents"
            className="text-sm text-primary-dark"
          >
            ← All agents
          </Link>
        }
      />

      {!isApiConfigured() ? (
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
          Backend API is not configured. Check VITE_API_BASE_URL.
        </div>
      ) : isLoading ? (
        <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
          Loading agent details…
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-destructive">
            Could not load agent details:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded-xl border border-input px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        </div>
      ) : !agent ? (
        <EmptyState title="Agent not found" />
      ) : (
        <AgentReview agent={agent} />
      )}
    </>
  );
}
