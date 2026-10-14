import { createFileRoute } from "@tanstack/react-router";
import { PanelShell } from "@/components/panel";
import { SettingsPage } from "@/components/settings-page";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TripFlyer Admin" },
      { name: "description", content: "Admin account and connection settings." },
      { property: "og:title", content: "Settings — TripFlyer Admin" },
      { property: "og:description", content: "Admin settings." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <PanelShell area="admin"><SettingsPage /></PanelShell>,
});
