import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { StatusBadge } from "@/components/brand";
import { Field } from "@/components/auth-forms";
import { Card, PageHeader, PanelShell, PendingIntegration, Spinner } from "@/components/panel";
import { useAgent } from "@/components/agent-data";
import { WalletNotLinked } from "@/components/wallet-ui";
import { errorMessage } from "@/lib/api/client";
import { PAYMENT_METHODS, fmtDate, fmtMoney, methodLabel, walletApi, type PaymentMethod, type TopUpRequest } from "@/lib/api/wallet";

export const Route = createFileRoute("/agent/wallet/top-up")({
  head: () => ({
    meta: [
      { title: "Request wallet top-up — TripFlyer Agent" },
      { name: "description", content: "Submit a manual wallet top-up request via bank transfer, bKash, Nagad, Rocket or cash." },
      { property: "og:title", content: "Wallet top-up — TripFlyer" },
      { property: "og:description", content: "Submit a manual wallet top-up request for admin review." },
    ],
  }),
  component: () => <PanelShell area="agent"><TopUp /></PanelShell>,
});

const schema = z.object({
  amount: z.coerce.number({ invalid_type_error: "Enter an amount" }).positive("Amount must be greater than 0").max(10_000_000, "Amount is too large"),
  paymentMethod: z.enum(PAYMENT_METHODS.map((p) => p.value) as [PaymentMethod, ...PaymentMethod[]], { errorMap: () => ({ message: "Select a payment method" }) }),
  transactionReference: z.string().trim().min(3, "Enter the transaction reference").max(100),
  paymentProofUrl: z.string().trim().url("Enter a valid URL").max(500).optional().or(z.literal("")),
});

function TopUp() {
  const { session } = useAgent();
  const id = session?.backendAgentId;
  const [f, setF] = useState({ amount: "", paymentMethod: "", transactionReference: "", paymentProofUrl: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<TopUpRequest[]>([]);
  const m = useMutation({
    mutationFn: (input: z.infer<typeof schema>) => walletApi.createTopUp(id!, { ...input, paymentProofUrl: input.paymentProofUrl || undefined }),
    onSuccess: (r) => { setSubmitted((s) => [r, ...s]); setF({ amount: "", paymentMethod: "", transactionReference: "", paymentProofUrl: "" }); toast.success("Top-up request submitted — awaiting admin review"); },
  });

  if (!id) return <><PageHeader eyebrow="Finance" title="Request wallet top-up" /><WalletNotLinked /></>;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (m.isPending) return;
    const r = schema.safeParse(f);
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]))); return; }
    setErrors({}); m.mutate(r.data);
  };

  return (
    <>
      <PageHeader eyebrow="Finance" title="Request wallet top-up" description="Your balance only changes after a TripFlyer administrator approves the request." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <form onSubmit={submit} noValidate className="grid gap-4">
            <Field label="Amount (BDT)" required error={errors.amount}><input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} className="field" aria-invalid={!!errors.amount} /></Field>
            <Field label="Payment method" required error={errors.paymentMethod}>
              <select value={f.paymentMethod} onChange={(e) => setF({ ...f, paymentMethod: e.target.value })} className="field" aria-invalid={!!errors.paymentMethod}>
                <option value="">Select…</option>{PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Transaction reference" required error={errors.transactionReference}><input value={f.transactionReference} onChange={(e) => setF({ ...f, transactionReference: e.target.value })} className="field" placeholder="e.g. bKash TrxID" aria-invalid={!!errors.transactionReference} /></Field>
            <Field label="Payment proof URL" error={errors.paymentProofUrl}><input value={f.paymentProofUrl} onChange={(e) => setF({ ...f, paymentProofUrl: e.target.value })} className="field" placeholder="https://…" aria-invalid={!!errors.paymentProofUrl} /></Field>
            {m.isError && <div role="alert" className="rounded-xl bg-clay-soft px-3 py-2 text-sm">{errorMessage(m.error)}</div>}
            <button disabled={m.isPending} className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60">{m.isPending && <Spinner />}Submit request</button>
          </form>
        </Card>
        <div className="space-y-4">
          {submitted.length > 0 && (
            <Card>
              <h2 className="font-display text-lg font-semibold">Submitted this session</h2>
              <div className="mt-3 divide-y divide-border text-sm">
                {submitted.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 py-3">
                    <div><div className="font-medium">{fmtMoney(r.amount, r.currency)} · {methodLabel(r.paymentMethod)}</div>
                      <div className="font-mono text-xs text-muted-foreground">{r.transactionReference} · {fmtDate(r.createdAt)}</div>
                      {(r.adminRemarks ?? r.remarks) && <div className="text-xs">{r.adminRemarks ?? r.remarks}</div>}</div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}
          <PendingIntegration title="Top-up request history">The backend doesn't yet expose an endpoint for an agent to list their own top-up requests (Pending / Approved / Rejected with remarks). It will appear here once available.</PendingIntegration>
        </div>
      </div>
    </>
  );
}
