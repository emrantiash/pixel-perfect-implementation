import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/auth-forms";
import { Card, PageHeader } from "@/components/panel";
import { useAppSignOut, updateSession, useSession } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api/client";
import { usersApi } from "@/lib/api/users";

export function SettingsPage() {
  const s = useSession()!;
  const navigate = useNavigate();
  const [name, setName] = useState(s.name);
  const [phone, setPhone] = useState(s.phone ?? "");
  const [backendId, setBackendId] = useState(s.backendAgentId ?? "");
  const [phoneError, setPhoneError] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-semibold">Account</h2>
          <form
            className="mt-4 grid gap-4"
            onSubmit={async (e) => {
              e.preventDefault();

              if (name.trim().length < 2) {
                toast.error("Please enter your full name.");
                return;
              }

              if (s.role === "agent" && !/^01\d{9}$/.test(phone.trim())) {
                setPhoneError("Enter an 11-digit Bangladesh mobile number starting with 01.");
                return;
              }

              setPhoneError("");
              setSaving(true);

              try {
                if (!s.devPreview) {
                  const nameParts = name.trim().split(/\s+/);
                  const firstName = nameParts[0] ?? "";

                  await usersApi.updateMyProfile({
                    firstName,
                    lastName: nameParts.slice(1).join(" "),
                    ...(s.role === "agent" ? { phone: phone.trim() } : {}),
                  });
                }

                updateSession({
                  name: name.trim(),
                  ...(s.role === "agent" ? { phone: phone.trim() } : {}),
                  backendAgentId: backendId.trim() || undefined,
                });

                toast.success("Settings saved successfully.");
              } catch {
                toast.error("Failed to save settings. Please try again.");
              } finally {
                setSaving(false);
              }
            }}
          >
            <Field label="Full name" required>
              <input value={name} onChange={(e) => setName(e.target.value)} className="field" />
            </Field>

            <Field label="Email">
              <input value={s.email} disabled className="field opacity-60" />
            </Field>

            {s.role === "agent" && (
              <Field label="Phone number" required error={phoneError}>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="01712345678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 11));
                    setPhoneError("");
                  }}
                  className="field"
                />
              </Field>
            )}

            {s.role === "agent" && s.devPreview && (
              <Field label="Backend agent ID (development preview)">
                <input
                  value={backendId}
                  onChange={(e) => setBackendId(e.target.value)}
                  className="field font-mono"
                  placeholder="Agent ID from the NestJS database"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Will be supplied by the backend after sign-in once Clerk is connected.
                </span>
              </Field>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-fit rounded-xl bg-[#ea622e] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </form>
        </Card>
        <Card>
          <h2 className="font-display text-lg font-semibold">Connection</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="eyebrow text-[10px]">API</dt>
              <dd className="font-mono text-xs">
                {API_BASE_URL || "Not configured (VITE_API_BASE_URL)"}
              </dd>
            </div>
            {/* <div>
              <dt className="eyebrow text-[10px]">Authentication</dt>
              <dd>{s.devPreview ? "Development preview — Clerk not connected" : "Clerk"}</dd>
            </div> */}
          </dl>
          <button
            onClick={() => {
              useAppSignOut();
              navigate({ to: "/" });
            }}
            className="mt-6 rounded-xl border border-input px-4 py-2 text-sm font-medium"
          >
            Sign out
          </button>
        </Card>
      </div>
    </>
  );
}
