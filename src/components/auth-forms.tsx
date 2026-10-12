import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/brand";
import { Spinner } from "@/components/panel";
import { authAdapter, startDevPreview, type Role } from "@/lib/auth";
import { ensureAgentForUser } from "@/lib/mock/agents";
import { useSession } from "@/lib/auth";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex h-16 max-w-md items-center px-6"><Logo /></div>
      <main className="mx-auto max-w-md px-6 pb-20">{children}</main>
    </div>
  );
}

export function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}{required && <span className="text-error"> *</span>}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-error">{error}</span>}
    </label>
  );
}

export function PasswordInput({ value, onChange, invalid, autoComplete }: { value: string; onChange: (v: string) => void; invalid?: boolean; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} className="field pr-10" aria-invalid={invalid} autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function DevPreviewBox({ onStart, label }: { onStart: () => void; label: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-warning/50 bg-sand-soft p-4 text-sm">
      <div className="eyebrow">Development preview only</div>
      <p className="mt-1 text-muted-foreground">Explore the panel without real authentication. Nothing is verified and no account is created.</p>
      <button type="button" onClick={onStart} className="mt-3 rounded-xl border border-input bg-surface px-3 py-2 text-sm font-medium">{label}</button>
    </div>
  );
}

export function SignInForm({ role }: { role: Role }) {
  const navigate = useNavigate();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dest = role === "agent" ? "/agent/dashboard" : "/admin/dashboard";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!z.string().email().safeParse(email).success || !password) { setError("Enter your email and password."); return; }
    setBusy(true); setError(null);
    try { await authAdapter.signIn(email, password); navigate({ to: dest }); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const preview = () => {
    const name = role === "agent" ? "Preview Agent" : "Preview Admin";
    startDevPreview({ role, name, email: email || `${role}.preview@example.com` });
    navigate({ to: dest });
  };

  return (
    <AuthLayout>
      <span className="eyebrow">{role === "agent" ? "Agent" : "Admin"} sign in</span>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Welcome back</h1>
      {session?.role === role && <p className="mt-2 text-sm">You're already in a preview session. <Link to={dest} className="font-medium text-primary-dark underline">Go to dashboard</Link></p>}
      <form onSubmit={submit} className="mt-6 grid gap-4 rounded-[28px] border border-border bg-surface p-6 shadow-soft" noValidate>
        <Field label="Email" required><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" autoComplete="email" /></Field>
        <Field label="Password" required><PasswordInput value={password} onChange={setPassword} autoComplete="current-password" /></Field>
        {error && <div role="alert" className="rounded-xl bg-clay-soft px-3 py-2 text-sm">{error}</div>}
        <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-60">{busy && <Spinner />}Sign in</button>
        {role === "agent" && <p className="text-center text-sm text-muted-foreground">New agency? <Link to="/agent/register" className="font-medium text-foreground underline">Create an account</Link></p>}
      </form>
      <DevPreviewBox onStart={preview} label={`Continue as preview ${role}`} />
    </AuthLayout>
  );
}

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().regex(/^(\+?880|0)1[3-9]\d{8}$/, "Enter a valid Bangladeshi mobile number, e.g. 01712345678"),
  password: z.string().min(8, "Use at least 8 characters").max(128),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });

export function RegisterForm() {
  const navigate = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const up = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErrors({}); setBusy(true); setError(null);
    try { await authAdapter.signUp({ name: r.data.name, email: r.data.email, phone: r.data.phone, password: r.data.password }); navigate({ to: "/agent/dashboard" }); }
    catch (err) { setError((err as Error).message); setNotConfigured(true); }
    finally { setBusy(false); }
  };
  const preview = () => {
    startDevPreview({ role: "agent", name: f.name.trim() || "Preview Agent", email: f.email.trim() || "agent.preview@example.com", phone: f.phone.trim() });
    navigate({ to: "/agent/dashboard" });
  };

  return (
    <AuthLayout>
      <span className="eyebrow">Agent registration</span>
      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Partner with TripFlyer</h1>
      <p className="mt-2 text-sm text-muted-foreground">Create your account first. You'll add business details and verification documents from your dashboard after signing in.</p>
      <form onSubmit={submit} noValidate className="mt-6 grid gap-4 rounded-[28px] border border-border bg-surface p-6 shadow-soft">
        <Field label="Full name" required error={errors.name}><input value={f.name} onChange={(e) => up("name")(e.target.value)} className="field" autoComplete="name" aria-invalid={!!errors.name} /></Field>
        <Field label="Email address" required error={errors.email}><input type="email" value={f.email} onChange={(e) => up("email")(e.target.value)} className="field" autoComplete="email" placeholder="you@agency.com.bd" aria-invalid={!!errors.email} /></Field>
        <Field label="Phone number" required error={errors.phone}><input type="tel" value={f.phone} onChange={(e) => up("phone")(e.target.value)} className="field" autoComplete="tel" placeholder="01712345678" aria-invalid={!!errors.phone} /></Field>
        <Field label="Password" required error={errors.password}><PasswordInput value={f.password} onChange={up("password")} invalid={!!errors.password} autoComplete="new-password" /></Field>
        <Field label="Confirm password" required error={errors.confirm}><PasswordInput value={f.confirm} onChange={up("confirm")} invalid={!!errors.confirm} autoComplete="new-password" /></Field>
        {error && <div role="alert" className="rounded-xl bg-clay-soft px-3 py-2 text-sm">{error}</div>}
        <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-60">{busy && <Spinner />}Create account</button>
        <p className="text-center text-sm text-muted-foreground">Already registered? <Link to="/agent/sign-in" className="font-medium text-foreground underline">Agent sign in</Link></p>
      </form>
      {notConfigured && <DevPreviewBox onStart={preview} label="Continue in development preview" />}
    </AuthLayout>
  );
}

/** Creates the local preview agent profile once a session exists (never before). */
export function useEnsureAgentProfile() {
  const s = useSession();
  if (s && s.role === "agent") ensureAgentForUser(s);
  return s;
}
