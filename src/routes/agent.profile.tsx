import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Field } from "@/components/auth-forms";
import { Card, PageHeader, PanelShell, Skeleton } from "@/components/panel";
import { useAgent } from "@/components/agent-data";
import { BUSINESS_TYPES, saveBusiness, saveOwner, type Business, type Owner } from "@/lib/mock/agents";

export const Route = createFileRoute("/agent/profile")({
  head: () => ({
    meta: [
      { title: "Agency profile — TripFlyer Agent" },
      { name: "description", content: "Manage your agency's business profile and owner information." },
      { property: "og:title", content: "Agency profile — TripFlyer" },
      { property: "og:description", content: "Business profile and owner details for TripFlyer agents." },
    ],
  }),
  component: () => <PanelShell area="agent"><Profile /></PanelShell>,
});

const bSchema = z.object({
  name: z.string().trim().min(2, "Enter the agency name").max(150),
  type: z.string().min(1, "Select a business type"),
  address: z.string().trim().min(4, "Enter the business address").max(300),
  city: z.string().trim().min(2, "Enter the city").max(80),
  country: z.string().trim().min(2, "Enter the country").max(80),
  currency: z.string().length(3, "Select a currency"),
});
const oSchema = z.object({
  designation: z.string().trim().min(2, "Enter the owner's designation").max(80),
  nidNumber: z.string().trim().regex(/^(\d{10}|\d{13}|\d{17})$/, "NID must be 10, 13 or 17 digits"),
  dateOfBirth: z.string().optional(),
});
const errs = (r: z.SafeParseReturnType<unknown, unknown>) => (r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message])));

function Profile() {
  const { session, agent } = useAgent();
  const [b, setB] = useState<Business | null>(null);
  const [o, setO] = useState<Owner | null>(null);
  const [be, setBe] = useState<Record<string, string>>({});
  const [oe, setOe] = useState<Record<string, string>>({});
  useEffect(() => { if (agent && !b) { setB(agent.business); setO(agent.owner); } }, [agent, b]);
  if (!agent || !b || !o || !session) return <Skeleton />;

  const inp = (v: string, on: (v: string) => void, err?: string, type = "text") =>
    <input type={type} value={v} onChange={(e) => on(e.target.value)} className="field" aria-invalid={!!err} />;

  return (
    <>
      <PageHeader eyebrow="Onboarding" title="Agency profile" description="Saved locally in development preview — the agent profile API is pending." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-semibold">A. Business profile</h2>
          <form className="mt-4 grid gap-4" noValidate onSubmit={(e) => { e.preventDefault(); const r = bSchema.safeParse(b); setBe(errs(r)); if (r.success) { saveBusiness(agent.id, r.data); toast.success("Business profile saved"); } }}>
            <Field label="Company / agency name" required error={be.name}>{inp(b.name, (v) => setB({ ...b, name: v }), be.name)}</Field>
            <Field label="Business type" required error={be.type}>
              <select value={b.type} onChange={(e) => setB({ ...b, type: e.target.value })} className="field" aria-invalid={!!be.type}>
                <option value="">Select…</option>{BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Business address" required error={be.address}>{inp(b.address, (v) => setB({ ...b, address: v }), be.address)}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" required error={be.city}>{inp(b.city, (v) => setB({ ...b, city: v }), be.city)}</Field>
              <Field label="Country" required error={be.country}>{inp(b.country, (v) => setB({ ...b, country: v }), be.country)}</Field>
            </div>
            <Field label="Preferred currency" required error={be.currency}>
              <select value={b.currency} onChange={(e) => setB({ ...b, currency: e.target.value })} className="field">
                {["BDT", "USD", "AED", "SAR", "GBP"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <button className="w-fit rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background">Save business profile</button>
          </form>
        </Card>
        <Card>
          <h2 className="font-display text-lg font-semibold">B. Owner information</h2>
          <dl className="mt-4 grid gap-2 rounded-2xl bg-background p-4 text-sm sm:grid-cols-3">
            {[["Name", session.name], ["Email", session.email], ["Phone", session.phone || "—"]].map(([k, v]) => (
              <div key={k} className="min-w-0"><dt className="eyebrow text-[10px]">{k}</dt><dd className="truncate font-medium">{v}</dd></div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted-foreground">Taken from your account — change them in Settings.</p>
          <form className="mt-4 grid gap-4" noValidate onSubmit={(e) => { e.preventDefault(); const r = oSchema.safeParse(o); setOe(errs(r)); if (r.success) { saveOwner(agent.id, { ...o, ...r.data, dateOfBirth: r.data.dateOfBirth ?? "" }); toast.success("Owner information saved"); } }}>
            <Field label="Designation" required error={oe.designation}>{inp(o.designation, (v) => setO({ ...o, designation: v }), oe.designation)}</Field>
            <Field label="NID number" required error={oe.nidNumber}>{inp(o.nidNumber, (v) => setO({ ...o, nidNumber: v }), oe.nidNumber)}</Field>
            <Field label="Date of birth">{inp(o.dateOfBirth, (v) => setO({ ...o, dateOfBirth: v }), undefined, "date")}</Field>
            <button className="w-fit rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background">Save owner information</button>
          </form>
        </Card>
      </div>
    </>
  );
}
