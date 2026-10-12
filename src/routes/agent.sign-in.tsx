import { createFileRoute } from "@tanstack/react-router";
import { SignInForm } from "@/components/auth-forms";

export const Route = createFileRoute("/agent/sign-in")({
  head: () => ({
    meta: [
      { title: "Agent sign in — TripFlyer" },
      { name: "description", content: "Sign in to your TripFlyer agent panel." },
      { property: "og:title", content: "Agent sign in — TripFlyer" },
      { property: "og:description", content: "Access your TripFlyer agency dashboard." },
    ],
  }),
  component: () => <SignInForm role="agent" />,
});
