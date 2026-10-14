import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PanelShell, PendingIntegration } from "@/components/panel";

export const Route = createFileRoute("/admin/bookings")({
  head: () => ({
    meta: [
      { title: "Bookings — TripFlyer Admin" },
      { name: "description", content: "Operational booking list for TripFlyer administrators." },
      { property: "og:title", content: "Bookings — TripFlyer Admin" },
      { property: "og:description", content: "Admin booking operations." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <PanelShell area="admin">
      <PageHeader eyebrow="Operations" title="Bookings" />
      <PendingIntegration title="No booking API connected">Booking and ticketing states will be listed here once the booking endpoints exist in the backend.</PendingIntegration>
    </PanelShell>
  ),
});
