import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Field } from "@/components/auth-forms";
import { Card, PageHeader, PanelShell, Skeleton } from "@/components/panel";
import {
  BUSINESS_TYPES,
  saveBusiness,
  saveOwner,
  type Business,
  type Owner,
} from "@/lib/mock/agents";
import { usersApi } from "@/lib/api/users";
import type { MyAgentProfileResponse } from "@/lib/api/users";

export const Route = createFileRoute("/agent/profile")({
  head: () => ({
    meta: [
      { title: "Agency profile — TripFlyer Agent" },
      {
        name: "description",
        content: "Manage your agency's business profile and owner information.",
      },
      { property: "og:title", content: "Agency profile — TripFlyer" },
      {
        property: "og:description",
        content: "Business profile and owner details for TripFlyer agents.",
      },
    ],
  }),
  component: () => (
    <PanelShell area="agent">
      <Profile />
    </PanelShell>
  ),
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
  nidNumber: z
    .string()
    .trim()
    .regex(/^(\d{10}|\d{13}|\d{17})$/, "NID must be 10, 13 or 17 digits"),
  dateOfBirth: z.string().optional(),
});
const errs = (r: z.SafeParseReturnType<unknown, unknown>) =>
  r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));

function Profile() {
  const [profile, setProfile] = useState<MyAgentProfileResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingOwner, setSavingOwner] = useState(false);

  const [b, setB] = useState({
    name: "",
    type: "",
    address: "",
    city: "",
    country: "",
    currency: "BDT",
  });

  const [o, setO] = useState({
    designation: "",
    nidNumber: "",
    dateOfBirth: "",
  });

  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (profile) {
      setPhone(profile.user.phone ?? "");
    }
  }, [profile]);

  const [be, setBe] = useState<Record<string, string>>({});
  const [oe, setOe] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const result = await usersApi.getMyAgentProfile();

        if (!active) return;

        setProfile(result);

        if (result.businessProfile) {
          setB({
            name: result.businessProfile.companyName ?? "",
            type: result.businessProfile.businessType ?? "",
            address: result.businessProfile.address ?? "",
            city: result.businessProfile.city ?? "",
            country: result.businessProfile.country ?? "",
            currency: result.businessProfile.currency ?? "BDT",
          });
        }

        if (result.ownerProfile) {
          setO({
            designation: result.ownerProfile.designation ?? "",
            nidNumber: result.ownerProfile.nidNumber ?? "",
            dateOfBirth: result.ownerProfile.dateOfBirth?.slice(0, 10) ?? "",
          });
        }
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Could not load your agent profile");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Skeleton />;

  if (!profile) {
    return (
      <PanelShell area="agent">
        <div className="p-6">
          <p>Unable to load your agent profile.</p>
          <button
            type="button"
            className="mt-3 rounded-xl bg-foreground px-5 py-2.5 text-sm text-background"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </PanelShell>
    );
  }

  const inp = (value: string, onChange: (value: string) => void, error?: string, type = "text") => (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="field"
      aria-invalid={!!error}
    />
  );

  async function handleBusinessSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = bSchema.safeParse(b);
    setBe(errs(result));

    if (!result.success) return;

    setSavingBusiness(true);

    try {
      const saved = await usersApi.saveMyBusinessProfile({
        companyName: result.data.name,
        businessType: result.data.type,
        address: result.data.address,
        city: result.data.city,
        country: result.data.country,
        currency: result.data.currency,
      });

      // Re-fetch the authoritative persisted state.
      const refreshed = await usersApi.getMyAgentProfile();
      setProfile(refreshed);

      if (refreshed.businessProfile) {
        setB({
          name: refreshed.businessProfile.companyName,
          type: refreshed.businessProfile.businessType,
          address: refreshed.businessProfile.address,
          city: refreshed.businessProfile.city,
          country: refreshed.businessProfile.country,
          currency: refreshed.businessProfile.currency,
        });
      }

      toast.success("Business profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save business profile");
    } finally {
      setSavingBusiness(false);
    }
  }

  async function handleOwnerSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = oSchema.safeParse(o);
    setOe(errs(result));

    if (!result.success) return;

    setSavingOwner(true);

    try {
      await usersApi.saveMyOwnerProfile({
        designation: result.data.designation,
        nidNumber: result.data.nidNumber,
        ...(result.data.dateOfBirth ? { dateOfBirth: result.data.dateOfBirth } : {}),
      });

      const refreshed = await usersApi.getMyAgentProfile();
      setProfile(refreshed);

      if (refreshed.ownerProfile) {
        setO({
          designation: refreshed.ownerProfile.designation,
          nidNumber: refreshed.ownerProfile.nidNumber,
          dateOfBirth: refreshed.ownerProfile.dateOfBirth?.slice(0, 10) ?? "",
        });
      }

      toast.success("Owner information saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save owner information");
    } finally {
      setSavingOwner(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Onboarding"
        title="Agency profile"
        description="Manage your saved business profile and owner information."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-semibold">A. Business profile</h2>

          <form className="mt-4 grid gap-4" noValidate onSubmit={handleBusinessSubmit}>
            <Field label="Company / agency name" required error={be["name"]}>
              {inp(b.name, (v) => setB({ ...b, name: v }), be["name"])}
            </Field>

            <Field label="Business type" required error={be["type"]}>
              <select
                value={b.type}
                onChange={(e) => setB({ ...b, type: e.target.value })}
                className="field"
                aria-invalid={!!be["type"]}
              >
                <option value="">Select…</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Business address" required error={be["address"]}>
              {inp(b.address, (v) => setB({ ...b, address: v }), be["address"])}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" required error={be["city"]}>
                {inp(b.city, (v) => setB({ ...b, city: v }), be["city"])}
              </Field>

              <Field label="Country" required error={be["country"]}>
                {inp(b.country, (v) => setB({ ...b, country: v }), be["country"])}
              </Field>
            </div>

            <Field label="Preferred currency" required error={be["currency"]}>
              <select
                value={b.currency}
                onChange={(e) => setB({ ...b, currency: e.target.value })}
                className="field"
                aria-invalid={!!be["currency"]}
              >
                {["BDT", "USD", "AED", "SAR", "GBP"].map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </Field>

            <button
              type="submit"
              disabled={savingBusiness}
              className="w-fit rounded-xl bg-[#ea622e] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {savingBusiness ? "Saving…" : "Save business profile"}
            </button>
          </form>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold">B. Owner information</h2>

          <dl className="mt-4 grid gap-2 rounded-2xl bg-background p-4 text-sm sm:grid-cols-3">
            {[
              [
                "Name",
                profile.user.firstName
                  ? `${profile.user.firstName} ${profile.user.lastName ?? ""}`.trim()
                  : "—",
              ],
              ["Email", profile.user.email ?? "—"],
              ["Phone", profile.user.phone || "—"],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="eyebrow text-[10px]">{label}</dt>
                <dd className="truncate font-medium">{value}</dd>
              </div>
            ))}
          </dl>

         
          <p className="mt-2 text-xs text-muted-foreground">
            Account details are managed through your account settings.
          </p>

          <form className="mt-4 grid gap-4" noValidate onSubmit={handleOwnerSubmit}>
            <Field label="Designation" required error={oe["designation"]}>
              {inp(o.designation, (v) => setO({ ...o, designation: v }), oe["designation"])}
            </Field>

            <Field label="NID number" required error={oe["nidNumber"]}>
              {inp(o.nidNumber, (v) => setO({ ...o, nidNumber: v }), oe["nidNumber"])}
            </Field>

            <Field label="Date of birth">
              {inp(o.dateOfBirth, (v) => setO({ ...o, dateOfBirth: v }), undefined, "date")}
            </Field>

            <button
              type="submit"
              disabled={savingOwner}
              className="w-fit rounded-xl bg-[#ea622e] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {savingOwner ? "Saving…" : "Save owner information"}
            </button>
          </form>
        </Card>
      </div>
    </>
  );
}
