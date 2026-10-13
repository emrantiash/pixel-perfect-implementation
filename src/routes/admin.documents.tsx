import { createFileRoute, redirect } from "@tanstack/react-router";

// Old URL — kept working.
export const Route = createFileRoute("/admin/documents")({
  beforeLoad: () => { throw redirect({ to: "/admin/agent-verification", statusCode: 301 }); },
});
