import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "@/components/auth-forms";

export const Route = createFileRoute("/agent/register")({
  head: () => ({
    meta: [
      { title: "Become a TripFlyer agent — Create account" },
      { name: "description", content: "Create your TripFlyer agent account. Business verification is completed after sign-in." },
      { property: "og:title", content: "Become a TripFlyer agent" },
      { property: "og:description", content: "Create your agent account and start booking flights in BDT." },
    ],
  }),
  component: RegisterForm,
});
