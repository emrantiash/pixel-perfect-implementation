import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Logo } from "@/components/brand";
import { REQUIRED_DOCS, registerAgent, type DocType } from "@/lib/mock/agents";

export const Route = createFileRoute("/agent/register")({
  head: () => ({
    meta: [
      { title: "Become a TripFlyer agent — Registration" },
      { name: "description", content: "Register your travel agency with TripFlyer: business details, owner details and verification documents." },
      { property: "og:title", content: "Become a TripFlyer agent" },
      { property: "og:description", content: "Register your travel agency and start booking flights in BDT." },
    ],
  }),
  component: Register,
});

const business = z.object({
  businessName: z.string().trim().min(2, "Enter your agency name"),
  businessAddress: z.string().trim().min(4, "Enter the business address"),
  city: z.string().trim().min(2, "Enter the city"),
});
const owner = z.object({
  ownerName: z.string().trim().min(2, "Enter the owner's full name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().regex(/^\+?[0-9 ]{10,15}$/, "Enter a valid phone number"),
});
const steps = ["Business", "Owner", "Documents", "Review"];

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ businessName: "", businessAddress: "", city: "Dhaka", ownerName: "", email: "", phone: "" });
  const [files, setFiles] = useState<Partial<Record<DocType, string>>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const schema = step === 0 ? business : step === 1 ? owner : null;
    if (schema) {
      const r = schema.safeParse(form);
      if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))); return false; }
    }
    if (step === 2) {
      const missing = REQUIRED_DOCS.filter((d) => !files[d.type]);
      if (missing.length) { setErrors(Object.fromEntries(missing.map((d) => [d.type, "This document is required"]))); return false; }
    }
    setErrors({}); return true;
  };
  const next = () => validate() && setStep(step + 1);
  const submit = () => {
    registerAgent({ ...form, files: files as Record<DocType, string> });
    navigate({ to: "/agent/dashboard" });
  };

  const input = (k: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input type={type} value={form[k]} placeholder={placeholder} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="field" aria-invalid={!!errors[k]} />
      {errors[k] && <span className="mt-1 block text-xs text-error">{errors[k]}</span>}
    </label>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex h-16 max-w-3xl items-center px-6"><Logo /></div>
      <main className="mx-auto max-w-3xl px-6 pb-20">
        <span className="eyebrow">Agent registration</span>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Partner with TripFlyer</h1>
        <p className="mt-2 text-muted-foreground">Takes about 5 minutes. Our team reviews documents within one business day.</p>

        <ol className="mt-8 flex gap-2">
          {steps.map((s, i) => (
            <li key={s} className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium ${i === step ? "bg-foreground text-background" : i < step ? "bg-sage-soft" : "bg-muted text-muted-foreground"}`}>
              <span className="font-mono">0{i + 1}</span> {s}
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-[28px] border border-border bg-surface p-6 shadow-soft">
          {step === 0 && <div className="grid gap-4">
            {input("businessName", "Agency name", "text", "e.g. Skyline Tours & Travels")}
            {input("businessAddress", "Business address", "text", "House, road, area")}
            {input("city", "City")}
          </div>}
          {step === 1 && <div className="grid gap-4">
            {input("ownerName", "Owner full name")}
            {input("email", "Email", "email", "you@agency.com.bd")}
            {input("phone", "Mobile number", "tel", "+880 17XX XXXXXX")}
          </div>}
          {step === 2 && <div className="grid gap-3">
            {REQUIRED_DOCS.map((d) => (
              <div key={d.type} className="flex items-center justify-between gap-4 rounded-2xl bg-background p-4">
                <div>
                  <div className="text-sm font-medium">{d.label}</div>
                  <div className={`text-xs ${errors[d.type] ? "text-error" : "text-muted-foreground"}`}>{errors[d.type] ?? files[d.type] ?? "PDF, JPG or PNG · max 5 MB"}</div>
                </div>
                <label className="cursor-pointer rounded-xl border border-input px-3 py-2 text-sm font-medium hover:bg-muted">
                  {files[d.type] ? "Replace" : "Upload"}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) setFiles({ ...files, [d.type]: f.name }); }} />
                </label>
              </div>
            ))}
          </div>}
          {step === 3 && <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {[["Agency", form.businessName], ["Address", `${form.businessAddress}, ${form.city}`], ["Owner", form.ownerName], ["Email", form.email], ["Phone", form.phone], ["Documents", `${Object.keys(files).length} of ${REQUIRED_DOCS.length} uploaded`]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-background p-3"><dt className="eyebrow text-[10px]">{k}</dt><dd className="mt-1 font-medium">{v}</dd></div>
            ))}
          </dl>}

          <div className="mt-6 flex justify-between">
            <button disabled={step === 0} onClick={() => setStep(step - 1)} className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground disabled:opacity-40">Back</button>
            {step < 3
              ? <button onClick={next} className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-primary-dark">Continue</button>
              : <button onClick={submit} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-dark">Submit for verification</button>}
          </div>
        </div>
      </main>
    </div>
  );
}
