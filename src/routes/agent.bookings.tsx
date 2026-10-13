import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PanelShell, PendingIntegration } from "@/components/panel";

export const Route = createFileRoute("/agent/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings — TripFlyer Agent" },
      { name: "description", content: "Your agency's flight bookings and tickets." },
      { property: "og:title", content: "Agent bookings — TripFlyer" },
      { property: "og:description", content: "Agency bookings and ticket management." },
    ],
  }),
  component: () => (
    <PanelShell area="agent">
      <PageHeader eyebrow="Booking" title="Bookings" />
      <PendingIntegration title="No booking API connected">Bookings and ticket statuses will appear here once the booking endpoints are available in the backend.</PendingIntegration>
    </PanelShell>
  ),
});
