import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, PanelShell, EmptyState } from "@/components/panel";
import { AgentReview } from "@/components/agent-review";
import { useAgentsStore } from "@/lib/mock/agents";

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
  component: () => <PanelShell area="admin"><Detail /></PanelShell>,
});

function Detail() {
  const { agentId } = Route.useParams();
  const agent = useAgentsStore().agents.find((a) => a.id === agentId);
  return (
    <>
      <PageHeader eyebrow="Agents" title="Agent details" actions={<Link to="/admin/agents" className="text-sm text-primary-dark">← All agents</Link>} />
      {agent ? <AgentReview agent={agent} /> : <EmptyState title="Agent not found" />}
    </>
  );
}
