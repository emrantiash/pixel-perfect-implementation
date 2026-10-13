import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/auth-forms";
import { Card, PageHeader } from "@/components/panel";
import { signOut, updateSession, useSession } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api/client";

export function SettingsPage() {
  const s = useSession()!;
  const navigate = useNavigate();
  const [name, setName] = useState(s.name);
  const [phone, setPhone] = useState(s.phone ?? "");
  const [backendId, setBackendId] = useState(s.backendAgentId ?? "");
  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-semibold">Account</h2>
          <form className="mt-4 grid gap-4" onSubmit={(e) => { e.preventDefault(); if (name.trim().length < 2) return; updateSession({ name: name.trim(), phone: phone.trim(), backendAgentId: backendId.trim() || undefined }); toast.success("Saved"); }}>
            <Field label="Full name" required><input value={name} onChange={(e) => setName(e.target.value)} className="field" /></Field>
            <Field label="Email"><input value={s.email} disabled className="field opacity-60" /></Field>
            {s.role === "agent" && <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="field" /></Field>}
            {s.role === "agent" && s.devPreview && (
              <Field label="Backend agent ID (development preview)">
                <input value={backendId} onChange={(e) => setBackendId(e.target.value)} className="field font-mono" placeholder="Agent ID from the NestJS database" />
                <span className="mt-1 block text-xs text-muted-foreground">Will be supplied by the backend after sign-in once Clerk is connected.</span>
              </Field>
            )}
            <button className="w-fit rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background">Save</button>
          </form>
        </Card>
        <Card>
          <h2 className="font-display text-lg font-semibold">Connection</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="eyebrow text-[10px]">API</dt><dd className="font-mono text-xs">{API_BASE_URL || "Not configured (VITE_API_BASE_URL)"}</dd></div>
            <div><dt className="eyebrow text-[10px]">Authentication</dt><dd>{s.devPreview ? "Development preview — Clerk not connected" : "Clerk"}</dd></div>
          </dl>
          <button onClick={() => { signOut(); navigate({ to: "/" }); }} className="mt-6 rounded-xl border border-input px-4 py-2 text-sm font-medium">Sign out</button>
        </Card>
      </div>
    </>
  );
}
