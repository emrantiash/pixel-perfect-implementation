import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/brand";
import { Spinner } from "@/components/panel";
import { startDevPreview, startClerkSession, useSession, type Role } from "@/lib/auth";
import { useAuth, useSignUp, useSignIn, useUser } from "@clerk/tanstack-react-start";
import { usersApi } from "@/lib/api/users";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex h-16 max-w-md items-center px-6">
        <Logo />
      </div>
      <main className="mx-auto max-w-md px-6 pb-20">{children}</main>
    </div>
  );
}

export function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-error">{error}</span>}
    </label>
  );
}

export function PasswordInput({
  value,
  onChange,
  invalid,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="field pr-10"
        aria-invalid={invalid}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function DevPreviewBox({ onStart, label }: { onStart: () => void; label: string }) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-warning/50 bg-sand-soft p-4 text-sm">
      <div className="eyebrow">Development preview only</div>
      <p className="mt-1 text-muted-foreground">
        Explore the panel without real authentication. Nothing is verified and no account is
        created.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-3 rounded-xl border border-input bg-surface px-3 py-2 text-sm font-medium"
      >
        {label}
      </button>
    </div>
  );
}

function useRedirectAuthenticatedUser(enabled = true) {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const previewSession = useSession();

  useEffect(() => {
    if (!enabled || !isLoaded) return;

    if (isSignedIn) {
      if (!userLoaded || !user) return;

      const publicRole = String(user.publicMetadata["role"] ?? "").toLowerCase();

      const accountType = String(user.unsafeMetadata["accountType"] ?? "").toLowerCase();

      let role: Role | null = null;

      if (publicRole === "admin") {
        role = "admin";
      } else if (publicRole === "agent" || accountType === "agent") {
        role = "agent";
      }

      if (!role) return;

      startClerkSession({
        userId: user.id,
        name: user.fullName ?? user.firstName ?? user.primaryEmailAddress?.emailAddress ?? "User",
        email: user.primaryEmailAddress?.emailAddress ?? "",
        ...(user.primaryPhoneNumber?.phoneNumber
          ? { phone: user.primaryPhoneNumber.phoneNumber }
          : {}),
        role,
      });

      void navigate({
        to: role === "admin" ? "/admin/dashboard" : "/agent/dashboard",
      });

      return;
    }

    if (previewSession) {
      void navigate({
        to: previewSession.role === "admin" ? "/admin/dashboard" : "/agent/dashboard",
      });
    }
  }, [enabled, isLoaded, isSignedIn, userLoaded, user, previewSession, navigate]);
}

export function SignInForm({ role }: { role: Role }) {
  const navigate = useNavigate();
  const { signIn } = useSignIn();
  const session = useSession();

  const [email, setEmail] = useState("tiashiit904@gmail.com");
  const [verificationCode, setVerificationCode] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useRedirectAuthenticatedUser(!busy && !awaitingVerification);

  const dest = role === "agent" ? "/agent/dashboard" : "/admin/dashboard";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailAddress = email.trim();

    if (!z.string().email().safeParse(emailAddress).success) {
      setError("Enter a valid email address.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { error: createError } = await signIn.create({
        identifier: emailAddress,
      });

      if (createError) {
        throw new Error(createError.message);
      }

      const { error: codeError } = await signIn.emailCode.sendCode();

      if (codeError) {
        throw new Error(codeError.message);
      }

      setVerificationCode("");
      setAwaitingVerification(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send the verification code. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setError("Enter the verification code sent to your email.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { error: verificationError } = await signIn.emailCode.verifyCode({
        code: verificationCode.trim(),
      });

      if (verificationError) {
        throw new Error(verificationError.message);
      }

      if (signIn.status !== "complete") {
        throw new Error(`Sign-in requires additional verification: ${signIn.status}.`);
      }

      await signIn.finalize();
      const me = await usersApi.getMe();
      await navigate({ to: dest });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to verify the code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signIn) {
      setError("Sign-in is not ready yet. Please try again.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { error: verificationError } = await signIn.emailCode.verifyCode({
        code: verificationCode.trim(),
      });

      if (verificationError) {
        throw new Error(verificationError.message);
      }

      if (signIn.status !== "complete") {
        throw new Error(`Email verification is incomplete: ${signIn.status}`);
      }

      await signIn.finalize();

      // Fetch the authenticated user's actual backend role and profile.
      const me = await usersApi.getMe();

      if (me.status !== "ACTIVE") {
        throw new Error("Your account is not active. Please contact support.");
      }

      if (me.role !== "AGENT" && me.role !== "ADMIN") {
        throw new Error("This account does not have dashboard access.");
      }

      // The requested sign-in page must match the backend-authorized role.
      if (me.role !== role.toUpperCase()) {
        throw new Error(`This is not an ${role} account. Please use the correct sign-in page.`);
      }

      startClerkSession({
        userId: me.clerkUserId,
        name: [me.firstName, me.lastName].filter(Boolean).join(" "),
        email: me.email,
        role: me.role === "ADMIN" ? "admin" : "agent",
        ...(me.phone ? { phone: me.phone } : {}),
        ...(me.agentProfile?.id ? { backendAgentId: me.agentProfile.id } : {}),
      });

      setAwaitingVerification(false);

      await navigate({
        to: me.role === "ADMIN" ? "/admin/dashboard" : "/agent/dashboard",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to complete sign-in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const preview = () => {
    const name = role === "agent" ? "Preview Agent" : "Preview Admin";

    startDevPreview({
      role,
      name,
      email: email.trim() || `${role}.preview@example.com`,
    });

    navigate({ to: dest });
  };

  return (
    <AuthLayout>
      <span className="eyebrow">{role === "agent" ? "Agent" : "Admin"} sign in</span>

      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Welcome back</h1>

      {session?.role === role && (
        <p className="mt-2 text-sm">
          You're already in a preview session.{" "}
          <Link to={dest} className="font-medium text-primary-dark underline">
            Go to dashboard
          </Link>
        </p>
      )}

      {!awaitingVerification ? (
        <form
          onSubmit={submit}
          noValidate
          className="mt-6 grid gap-4 rounded-[28px] border border-border bg-surface p-6 shadow-soft"
        >
          <p className="text-sm text-muted-foreground">
            Enter your registered email address. We'll send you a verification code to sign in
            securely.
          </p>

          <Field label="Email address" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              autoComplete="email"
              placeholder="you@agency.com.bd"
              required
              disabled={busy}
            />
          </Field>

          {error && (
            <div role="alert" className="rounded-xl bg-clay-soft px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-60"
          >
            {busy && <Spinner />}
            Send verification code
          </button>

          {role === "agent" && (
            <p className="text-center text-sm text-muted-foreground">
              New agency?{" "}
              <Link to="/agent/register" className="font-medium text-foreground underline">
                Create an account
              </Link>
            </p>
          )}
        </form>
      ) : (
        <form
          // onSubmit={verifyEmail}
          onSubmit={verifyCode}
          className="mt-6 grid gap-4 rounded-[28px] border border-border bg-surface p-6 shadow-soft"
        >
          <h2 className="font-display text-xl font-bold">Verify your email</h2>

          <p className="text-sm text-muted-foreground">
            Enter the verification code sent to <strong>{email.trim()}</strong>.
          </p>

          <Field label="Email verification code" required>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="field"
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder="Enter your code"
              required
              disabled={busy}
            />
          </Field>

          {error && (
            <div role="alert" className="rounded-xl bg-clay-soft px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !verificationCode.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-60"
          >
            {busy && <Spinner />}
            Verify and sign in
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setAwaitingVerification(false);
              setVerificationCode("");
              setError(null);
            }}
            className="text-sm text-muted-foreground underline"
          >
            Back to email
          </button>
        </form>
      )}

      <DevPreviewBox onStart={preview} label={`Continue as preview ${role}`} />
    </AuthLayout>
  );
}

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  // phone: z.string().trim().max(30, "Phone number is too long").optional(),
  phone: z
    .string()
    .refine(
      (value) => value.trim() === "" || /^01\d{9}$/.test(value.trim()),
      "Enter a valid 11-digit Bangladesh phone number starting with 01",
    ),
  // password: z.string().min(8, "Use at least 8 characters").max(128),
  // confirm: z.string(),
});
// .refine((v) => v.password === v.confirm, {
//   path: ["confirm"],
//   message: "Passwords don't match",
// });

export function RegisterForm() {
  const navigate = useNavigate();
  const { signUp } = useSignUp();

  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    // password: "",
    // confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  useRedirectAuthenticatedUser(!busy && !awaitingVerification);

  const up = (k: keyof typeof f) => (v: string) => setF((previous) => ({ ...previous, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = schema.safeParse(f);

    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }

    setErrors({});
    setError(null);
    setBusy(true);

    try {
      const nameParts = result.data.name.trim().split(/\s+/);
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ");

      const { error: createError } = await signUp.create({
        emailAddress: result.data.email.trim(),
        firstName,
        ...(lastName ? { lastName } : {}),
        unsafeMetadata: {
          accountType: "agent",
        },
      });

      if (createError) {
        throw new Error(createError.message);
      }

      const { error: verificationError } = await signUp.verifications.sendEmailCode();

      if (verificationError) {
        throw new Error(verificationError.message);
      }

      setAwaitingVerification(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to start registration. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setError("Enter the verification code sent to your email.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { error: verificationError } = await signUp.verifications.verifyEmailCode({
        code: verificationCode.trim(),
      });

      if (verificationError) {
        throw new Error(verificationError.message);
      }

      if (signUp.status !== "complete") {
        const missing = signUp.missingFields ?? [];
        const unverified = signUp.unverifiedFields ?? [];
        const details = [
          ...missing.map((field) => `Missing: ${field}`),
          ...unverified.map((field) => `Unverified: ${field}`),
        ];

        setError(
          details.length > 0
            ? `Additional verification required: ${details.join(", ")}`
            : `Clerk sign-up status is "${signUp.status}". Check the browser console for details.`,
        );
        return;
      }

      await signUp.finalize();

      const nameParts = f.name.trim().split(/\s+/);
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ");

      await usersApi.startAgentRegistration({
        firstName,
        lastName,
        email: f.email.trim(),
        ...(f.phone.trim() ? { phone: f.phone.trim() } : {}),
      });

      navigate({ to: "/agent/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const preview = () => {
    startDevPreview({
      role: "agent",
      name: f.name.trim() || "Preview Agent",
      email: f.email.trim() || "agent.preview@example.com",
    });

    navigate({ to: "/agent/dashboard" });
  };

  return (
    <AuthLayout>
      <span className="eyebrow">Agent registration</span>

      <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
        {awaitingVerification ? "Verify your email" : "Partner with TripFlyer"}
      </h1>

      {awaitingVerification ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a verification code to <strong>{f.email}</strong>. Enter the code to complete
            your email verification.
          </p>

          <form
            onSubmit={verifyEmail}
            className="mt-6 grid gap-4 rounded-[28px] border border-border bg-surface p-6 shadow-soft"
          >
            <Field label="Email verification code" required>
              <input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="field"
                autoComplete="one-time-code"
                inputMode="numeric"
                placeholder="Enter your code"
                disabled={busy}
              />
            </Field>

            {error && (
              <div role="alert" className="rounded-xl bg-clay-soft px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <button
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
            >
              {busy && <Spinner />}
              Verify email
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setAwaitingVerification(false);
                setVerificationCode("");
                setError(null);
              }}
              className="text-sm text-muted-foreground underline"
            >
              Back to registration
            </button>
          </form>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account first. You'll add business details and verification documents from
            your dashboard after signing in.
          </p>

          <form
            onSubmit={submit}
            noValidate
            className="mt-6 grid gap-4 rounded-[28px] border border-border bg-surface p-6 shadow-soft"
          >
            <Field label="Full name" required error={errors["name"]}>
              <input
                value={f.name}
                onChange={(e) => up("name")(e.target.value)}
                className="field"
                autoComplete="name"
                aria-invalid={!!errors["name"]}
              />
            </Field>

            <Field label="Email address" required error={errors["email"]}>
              <input
                type="email"
                value={f.email}
                onChange={(e) => up("email")(e.target.value)}
                className="field"
                autoComplete="email"
                placeholder="you@agency.com.bd"
                aria-invalid={!!errors["email"]}
              />
            </Field>

            <Field label="Phone number" error={errors["phone"]}>
              <input
                type="tel"
                value={f.phone}
                onChange={(e) => up("phone")(e.target.value.replace(/\D/g, "").slice(0, 11))}
                className="field"
                autoComplete="tel"
                placeholder="e.g. 01712345678"
                maxLength={11}
                inputMode="numeric"
                aria-invalid={!!errors["phone"]}
                aria-describedby={errors["phone"] ? "signup-phone-error" : undefined}
              />
            </Field>

            {/* <Field label="Password" required error={errors["password"]}>
              <PasswordInput
                value={f.password}
                onChange={up("password")}
                invalid={!!errors["password"]}
                autoComplete="new-password"
              />
            </Field>

            <Field label="Confirm password" required error={errors["confirm"]}>
              <PasswordInput
                value={f.confirm}
                onChange={up("confirm")}
                invalid={!!errors["confirm"]}
                autoComplete="new-password"
              />
            </Field> */}

            {error && (
              <div role="alert" className="rounded-xl bg-clay-soft px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <button
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
            >
              {busy && <Spinner />}
              Create account
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link to="/agent/sign-in" className="font-medium text-foreground underline">
                Agent sign in
              </Link>
            </p>
          </form>
        </>
      )}

      {!awaitingVerification && (
        <DevPreviewBox onStart={preview} label="Continue in development preview" />
      )}
    </AuthLayout>
  );
}
