import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { Card, PageHeader, PanelShell, PendingIntegration, Skeleton } from "@/components/panel";
import { useAgent } from "@/components/agent-data";
import { verificationStatus } from "@/lib/mock/agents";

export const Route = createFileRoute("/agent/flights")({
  head: () => ({
    meta: [
      { title: "Flights — TripFlyer Agent" },
      { name: "description", content: "Search flights and manage agent bookings on TripFlyer." },
      { property: "og:title", content: "Agent flights — TripFlyer" },
      { property: "og:description", content: "Agent flight search and booking access." },
    ],
  }),
  component: () => <PanelShell area="agent"><AgentFlights /></PanelShell>,
});

function AgentFlights() {
  const { agent, session } = useAgent();
  if (!agent) return <Skeleton />;
  const verified = verificationStatus(agent) === "approved";
  const walletLinked = !!session?.backendAgentId;
  return (
    <>
      <PageHeader eyebrow="Booking" title="Flights" />
      <Card>
        <h2 className="font-display text-lg font-semibold">Search flights</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use the TripFlyer flight search to compare fares in BDT.</p>
        <Link to="/flights" className="mt-4 inline-block rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background">Open flight search</Link>
      </Card>
      {(!verified || !walletLinked) && (
        <div className="mt-6 flex gap-3 rounded-[20px] bg-sand-soft p-5 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <div>
            <div className="font-medium">Agent booking is restricted</div>
            <ul className="mt-1 list-disc pl-5 text-muted-foreground">
              {!verified && <li>Your business verification must be approved before you can book on behalf of travellers.</li>}
              {!walletLinked && <li>A funded wallet linked to your agent account is required to pay for bookings.</li>}
            </ul>
          </div>
        </div>
      )}
      <div className="mt-6"><PendingIntegration title="Agent booking & ticketing">Supplier search, booking and ticket-issuance APIs are not connected yet. Search results on the public page are sample data.</PendingIntegration></div>
    </>
  );
}
