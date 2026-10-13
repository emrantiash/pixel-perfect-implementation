import { createFileRoute } from "@tanstack/react-router";
import { PanelShell } from "@/components/panel";
import { SettingsPage } from "@/components/settings-page";

export const Route = createFileRoute("/agent/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TripFlyer Agent" },
      { name: "description", content: "Account and connection settings for your TripFlyer agent panel." },
      { property: "og:title", content: "Agent settings — TripFlyer" },
      { property: "og:description", content: "Agent account settings." },
    ],
  }),
  component: () => <PanelShell area="agent"><SettingsPage /></PanelShell>,
});

