import { createFileRoute } from "@tanstack/react-router";
import { SignInForm } from "@/components/auth-forms";

export const Route = createFileRoute("/admin/sign-in")({
  head: () => ({
    meta: [
      { title: "Admin sign in — TripFlyer" },
      { name: "description", content: "Sign in to the TripFlyer operations panel." },
      { property: "og:title", content: "Admin sign in — TripFlyer" },
      { property: "og:description", content: "TripFlyer operations sign in." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <SignInForm role="admin" />,
});
