import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { StatusBadge } from "@/components/brand";
import { Field } from "@/components/auth-forms";
import { Card, PageHeader, PanelShell, PendingIntegration, Spinner } from "@/components/panel";
import { useAgent } from "@/components/agent-data";
import { WalletNotLinked } from "@/components/wallet-ui";
import { errorMessage } from "@/lib/api/client";
import {
  PAYMENT_METHODS,
  fmtDate,
  fmtMoney,
  methodLabel,
  walletApi,
  type AgentTopUpDetail,
  type PaymentMethod,
  type TopUpRequest,
} from "@/lib/api/wallet";

export const Route = createFileRoute("/agent/wallet/top-up")({
  validateSearch: z
    .object({
      previousTopUpId: z.string().optional(),
      amount: z.string().optional(),
      paymentMethod: z
        .enum(PAYMENT_METHODS.map((p) => p.value) as [PaymentMethod, ...PaymentMethod[]])
        .optional(),
      transactionReference: z.string().optional(),
    })
    .catch({}),

  head: () => ({
    meta: [
      { title: "Request wallet top-up — TripFlyer Agent" },
      {
        name: "description",
        content:
          "Submit a manual wallet top-up request via bank transfer, bKash, Nagad, Rocket or cash.",
      },
      { property: "og:title", content: "Wallet top-up — TripFlyer" },
      {
        property: "og:description",
        content: "Submit a manual wallet top-up request for admin review.",
      },
    ],
  }),
  component: () => (
    <PanelShell area="agent">
      <TopUp />
    </PanelShell>
  ),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const schema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount (up to 2 decimal places)")
    .refine((value) => Number(value) > 0, "Amount must be greater than 0")
    .refine((value) => Number(value) <= 10_000_000, "Amount is too large"),

  paymentMethod: z.enum(
    PAYMENT_METHODS.map((p) => p.value) as [PaymentMethod, ...PaymentMethod[]],
    { errorMap: () => ({ message: "Select a payment method" }) },
  ),

  transactionReference: z.string().trim().min(3, "Enter the payment reference").max(100),
});

function getReferenceLabel(method: string) {
  switch (method) {
    case "BANK_TRANSFER":
      return "Bank Account Number";
    case "BKASH":
      return "bKash Transaction ID (TrxID)";
    case "NAGAD":
    case "ROCKET":
      return "Transaction ID";
    case "CASH":
      return "Payment Reference";
    default:
      return "Transaction Reference";
  }
}

function getReferencePlaceholder(method: string) {
  switch (method) {
    case "BANK_TRANSFER":
      return "Enter your bank account number";
    case "BKASH":
      return "Enter bKash TrxID";
    case "NAGAD":
      return "Enter Nagad transaction ID";
    case "ROCKET":
      return "Enter Rocket transaction ID";
    case "CASH":
      return "Enter payment reference";
    default:
      return "Enter transaction reference";
  }
}

function TopUp() {
  const { session } = useAgent();
  const id = session?.backendAgentId;
  const search = Route.useSearch();
  const previousTopUp = useQuery({
    queryKey: ["agent-top-up-detail", id, search.previousTopUpId],
    queryFn: ({ signal }) => walletApi.getAgentTopUp(id!, search.previousTopUpId!, signal),
    enabled: !!id && !!search.previousTopUpId,
    retry: false,
  });

  const [f, setF] = useState({
    amount: search.amount ?? "",
    paymentMethod: search.paymentMethod ?? "",
    transactionReference: search.transactionReference ?? "",
  });

  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  useEffect(() => {
    setF({
      amount: search.amount ?? "",
      paymentMethod: search.paymentMethod ?? "",
      transactionReference: search.transactionReference ?? "",
    });

    setProof(null);
    setFileInputKey((key) => key + 1);
    setErrors({});
  }, [search.previousTopUpId, search.amount, search.paymentMethod, search.transactionReference]);

  useEffect(() => {
    const previous = previousTopUp.data;

    if (!previous) return;

    setF({
      amount: String(previous.amount),
      paymentMethod: previous.method,
      transactionReference: previous.transactionReference ?? "",
    });
  }, [previousTopUp.data]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<TopUpRequest[]>([]);

  // Create and clean up the local screenshot preview.
  useEffect(() => {
    if (!proof) {
      setProofPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(proof);
    setProofPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [proof]);

  const m = useMutation({
    mutationFn: (input: { data: z.infer<typeof schema>; proof?: File; previousTopUpId?: string }) =>
      walletApi.createTopUp(id!, {
        amount: input.data.amount,
        method: input.data.paymentMethod,
        transactionReference: input.data.transactionReference,
        ...(input.proof ? { proof: input.proof } : {}),
        ...(input.previousTopUpId ? { previousTopUpId: input.previousTopUpId } : {}),
      }),

    onSuccess: (r) => {
      setSubmitted((s) => [r.topUpRequest, ...s]);

      setF({
        amount: "",
        paymentMethod: "",
        transactionReference: "",
      });

      setProof(null);
      setFileInputKey((key) => key + 1);
      setErrors({});

      toast.success("Top-up request submitted — awaiting admin review");
    },
  });

  if (!id)
    return (
      <>
        <PageHeader eyebrow="Finance" title="Request wallet top-up" />
        <WalletNotLinked />
      </>
    );

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    setProof(file);

    setErrors((previous) => ({
      ...previous,
      proof: "",
    }));

    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setProof(null);
      e.target.value = "";
      setErrors((previous) => ({
        ...previous,
        proof: "Only JPG, PNG and WEBP images are allowed",
      }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setProof(null);
      e.target.value = "";
      setErrors((previous) => ({
        ...previous,
        proof: "Image size must not exceed 5 MB",
      }));
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();

    if (m.isPending) return;

    const r = schema.safeParse(f);

    const nextErrors: Record<string, string> = {};

    if (!r.success) {
      r.error.issues.forEach((issue) => {
        nextErrors[String(issue.path[0])] = issue.message;
      });
    }

    const hasPreviousProof = !!previousTopUp.data?.proofUrl;

    if (!proof && !hasPreviousProof) {
      nextErrors["proof"] = "Please upload your payment screenshot";
    }

    setErrors(nextErrors);

    if (!r.success || (!proof && !hasPreviousProof)) return;

    m.mutate({
      data: r.data,
      ...(proof ? { proof } : {}),
      ...(search.previousTopUpId ? { previousTopUpId: search.previousTopUpId } : {}),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Request wallet top-up"
        description="Your balance only changes after a TripFlyer administrator approves the request."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <form onSubmit={submit} noValidate className="grid gap-4">
            <Field label="Amount (BDT)" required error={errors["amount"]}>
              <input
                inputMode="decimal"
                value={f.amount}
                onChange={(e) => setF({ ...f, amount: e.target.value })}
                className="field"
                aria-invalid={!!errors["amount"]}
              />
            </Field>

            <Field label="Payment method" required error={errors["paymentMethod"]}>
              <select
                value={f.paymentMethod}
                onChange={(e) =>
                  setF({
                    ...f,
                    paymentMethod: e.target.value,
                    transactionReference: "",
                  })
                }
                className="field"
                aria-invalid={!!errors["paymentMethod"]}
              >
                <option value="">Select…</option>
                {PAYMENT_METHODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              label={getReferenceLabel(f.paymentMethod)}
              required
              error={errors["transactionReference"]}
            >
              <input
                value={f.transactionReference}
                onChange={(e) =>
                  setF({
                    ...f,
                    transactionReference: e.target.value,
                  })
                }
                className="field"
                placeholder={getReferencePlaceholder(f.paymentMethod)}
                aria-invalid={!!errors["transactionReference"]}
              />
            </Field>

            <Field
              label="Payment screenshot"
              required={!previousTopUp.data?.proofUrl}
              error={errors["proof"]}
            >
              <input
                key={fileInputKey}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleProofChange}
                className="field"
                aria-invalid={!!errors["proof"]}
              />

              <p className="mt-1 text-xs text-muted-foreground">
                Upload a new payment confirmation screenshot if needed. JPG, PNG or WEBP · Maximum 5
                MB.
              </p>
            </Field>

            {previousTopUp.isLoading && (
              <p className="text-sm text-muted-foreground">
                Loading previous payment screenshot...
              </p>
            )}

            {previousTopUp.isError && (
              <div role="alert" className="rounded-xl bg-clay-soft px-3 py-2 text-sm">
                Could not load the previous rejected request. Please try again.
              </div>
            )}

            {!proof && previousTopUp.data?.proofUrl && (
              <div className="rounded-xl border border-border p-3">
                <p className="mb-2 text-sm font-medium">Previous proof — for reference only</p>

                <img
                  src={previousTopUp.data.proofUrl}
                  alt="Previous payment screenshot"
                  className="max-h-64 w-full rounded-lg object-contain"
                />
              </div>
            )}
            {/* </Field> */}

            {proofPreview && proof && (
              <div className="rounded-xl border border-border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Screenshot preview</span>

                  <button
                    type="button"
                    onClick={() => {
                      setProof(null);
                      setFileInputKey((key) => key + 1);
                      setErrors((previous) => ({
                        ...previous,
                        proof: "",
                      }));
                    }}
                    className="text-xs text-destructive hover:underline"
                  >
                    Remove
                  </button>
                </div>

                <img
                  src={proofPreview}
                  alt="Payment screenshot preview"
                  className="max-h-64 w-full rounded-lg object-contain"
                />

                <p className="mt-2 truncate text-xs text-muted-foreground">{proof.name}</p>
              </div>
            )}

            {m.isError && (
              <div role="alert" className="rounded-xl bg-clay-soft px-3 py-2 text-sm">
                {errorMessage(m.error)}
              </div>
            )}

            <button
              disabled={m.isPending}
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              {m.isPending && <Spinner />}
              Submit request
            </button>
          </form>
        </Card>

        <div className="space-y-4">
          {submitted.length > 0 && (
            <Card>
              <h2 className="font-display text-lg font-semibold">Submitted this session</h2>

              <div className="mt-3 divide-y divide-border text-sm">
                {submitted.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 py-3">
                    <div>
                      <div className="font-medium">
                        {fmtMoney(r.amount, r.currency)} · {methodLabel(r.method)}
                      </div>

                      <div className="font-mono text-xs text-muted-foreground">
                        {r.transactionReference} · {fmtDate(r.createdAt)}
                      </div>

                      {r.adminRemarks && <div className="text-xs">{r.adminRemarks}</div>}
                    </div>

                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          <PendingIntegration title="Top-up request history">
            The backend doesn't yet expose an endpoint for an agent to list their own top-up
            requests (Pending / Approved / Rejected with remarks). It will appear here once
            available.
          </PendingIntegration>
        </div>
      </div>
    </>
  );
}
