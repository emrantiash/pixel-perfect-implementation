import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { PageHeader, PanelShell } from "@/components/panel";
import { AgentReview } from "@/components/agent-review";

type DocStatus = "PENDING" | "APPROVED" | "REJECTED";
type QueueFilter = "pending" | "rejected" | "approved" | "all";

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

  const matchesFilter = (item: BackendAgent, status: Exclude<QueueFilter, "all">) => {
    const agentStatus = item.verificationStatus.toUpperCase();

    if (status === "pending") {
      return agentStatus === "PENDING" || agentStatus === "NEEDS_DOCUMENT";
    }

    return agentStatus === status.toUpperCase();
  };

  const visible = agents.filter((item) => (filter === "all" ? true : matchesFilter(item, filter)));

  const agent = visible.find((item) => item.id === selected) ?? visible[0];

  const count = (status: Exclude<QueueFilter, "all">) =>
    agents.filter((item) => matchesFilter(item, status)).length;

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Agent verification"
        description="Review business profiles and submitted verification documents."
      />

      <div className="flex w-fit flex-wrap gap-1 rounded-2xl border border-border bg-surface p-1">
        {(["pending", "rejected", "approved", "all"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium capitalize ${
              filter === item ? "bg-foreground text-background" : "text-muted-foreground"
            }`}
          >
            {item}
            <span className="ml-1 font-mono text-xs opacity-70">
              {item === "all" ? agents.length : count(item)}
            </span>
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="mt-6 rounded-2xl bg-surface p-8 text-center text-sm text-muted-foreground">
          Loading agent verification queue…
        </div>
      ) : isError ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm text-error">
            {error instanceof Error ? error.message : "Could not load agent verification data."}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-xl border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {visible.length === 0 && (
              <div className="rounded-2xl bg-surface p-6 text-center text-sm text-muted-foreground">
                Nothing here — queue is clear.
              </div>
            )}

            {visible.map((item) => {
              const ownerName = [item.user?.firstName, item.user?.lastName]
                .filter(Boolean)
                .join(" ");

              const pendingDocuments = item.documents.filter(
                (document) => document.verificationStatus === "PENDING",
              ).length;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelected(item.id)}
                  className={`w-full rounded-2xl p-4 text-left transition-colors ${
                    agent?.id === item.id ? "bg-clay-soft" : "bg-surface hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{item.companyName || "Profile incomplete"}</div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {ownerName || item.user?.email || "Owner details unavailable"}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{item.city || "Location not provided"}</span>
                    <span>
                      {pendingDocuments} pending document
                      {pendingDocuments === 1 ? "" : "s"}
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
          </div>

          {agent && <AgentReview key={agent.id} agent={agent} />}
        </div>
      )}
    </>
  );
}
