import { useEffect, useState } from "react";
import { usersApi, type AgentDocument } from "@/lib/api/users";
import type { MyAgentProfileResponse } from "@/lib/api/users";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/brand";
import {
  Card,
  PageHeader,
  PanelShell,
  PendingIntegration,
  Skeleton,
  ErrorState,
} from "@/components/panel";
import { useAgent, useAgentTransactions, useWallet } from "@/components/agent-data";
import { TransactionsTable, WalletNotLinked } from "@/components/wallet-ui";
import { fmtMoney } from "@/lib/api/wallet";
import {
  businessComplete,
  docsUploaded,
  ownerComplete,
  submitForReview,
  verificationStatus,
  REQUIRED_DOCS,
} from "@/lib/mock/agents";
import { errorMessage } from "@/lib/api/client";
import { useAuth } from "@clerk/tanstack-react-start";

export const Route = createFileRoute("/agent/dashboard")({
  head: () => ({
    meta: [
      { title: "Agent dashboard — TripFlyer" },
      {
        name: "description",
        content: "Your TripFlyer agency overview: onboarding, verification, wallet and bookings.",
      },
      { property: "og:title", content: "Agent dashboard — TripFlyer" },
      { property: "og:description", content: "Agency overview, verification status and wallet." },
    ],
  }),
  component: () => (
    <PanelShell area="agent">
      <Dashboard />
    </PanelShell>
  ),
});

function Dashboard() {
  const { session, agent } = useAgent();
  const [profile, setProfile] = useState<MyAgentProfileResponse | null>(null);
  const [documents, setDocuments] = useState<AgentDocument[]>([]);
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    let active = true;

    async function loadDashboardData() {
      try {
        const result = await usersApi.getMyAgentProfile();

        if (!active) return;
        setProfile(result);

        const agentId = result.businessProfile?.id;

        if (!agentId) {
          setDocuments([]);
          return;
        }

        const docs = await usersApi.getAgentDocuments(agentId);

        if (active) setDocuments(docs);
      } catch (error) {
        if (active) {
          console.error("Failed to load dashboard data:", error);
        }
      }
    }

    void loadDashboardData();

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn]);

  const agentId = session?.backendAgentId;
  const wallet = useWallet(agentId);
  const tx = useAgentTransactions(agentId, 1, 5);
  if (!agent || !session) return <Skeleton />;

  const bOk = profile?.completion.businessComplete ?? false;
  const oOk = profile?.completion.ownerComplete ?? false;
  const vs = verificationStatus(agent);
  const profilePct = profile?.completion.percentage ?? 0;

  const requiredDocuments = [
    { type: "NID", label: "NID" },
    { type: "TIN_CERTIFICATE", label: "TIN Certificate" },
    {
      type: "CIVIL_AVIATION_CERTIFICATE",
      label: "Civil Aviation Certificate",
    },
    { type: "TRADE_LICENSE", label: "Trade License" },
    { type: "OWNER_PICTURE", label: "Owner's Picture" },
  ] as const;

  const latestDocuments = new Map<string, AgentDocument>();

  for (const doc of [...documents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )) {
    if (!latestDocuments.has(doc.type)) {
      latestDocuments.set(doc.type, doc);
    }
  }

  const submittedCount = requiredDocuments.filter((item) => latestDocuments.has(item.type)).length;

  const approvedCount = requiredDocuments.filter(
    (item) => latestDocuments.get(item.type)?.verificationStatus === "APPROVED",
  ).length;

  const allDocs = submittedCount === requiredDocuments.length;

  const rejectedDocuments: Array<{
    label: string;
    remarks: string;
  }> = requiredDocuments.flatMap((item) => {
    const doc = latestDocuments.get(item.type);

    if (doc?.verificationStatus.toUpperCase() !== "REJECTED") {
      return [];
    }

    return [
      {
        label: item.label,
        remarks: doc.remarks?.trim() || "Please upload a corrected document.",
      },
    ];
  });

  const agentRejected = profile?.businessProfile?.verificationStatus === "REJECTED";

  const agentRejectionReason =
    profile?.businessProfile?.verificationRemarks?.trim() ||
    "Please contact the TripFlyer team for details.";

  const hasActionRequired = agentRejected || rejectedDocuments.length > 0;

  const actionRequiredMessage = [
    ...(agentRejected ? [`Application rejected: ${agentRejectionReason}`] : []),
    ...rejectedDocuments.map((doc) => `${doc.label}: ${doc.remarks}`),
  ].join(" · ");

  const actionRequiredSubtitle = hasActionRequired ? actionRequiredMessage : "No action needed";

  const steps = [
    {
      done: bOk,
      title: "Business profile",
      desc: "Agency name, type, address and currency",
      to: "/agent/profile" as const,
    },
    {
      done: oOk,
      title: "Owner information",
      desc: "Designation and NID details",
      to: "/agent/profile" as const,
    },
    {
      done: allDocs,
      title: "Required documents",
      desc: `${submittedCount} of ${REQUIRED_DOCS.length} uploaded`, //{`${submittedCount}/${REQUIRED_DOCS.length}`}
      to: "/agent/documents" as const,
    },
    {
      done: !!agent.submittedAt,
      title: "Review and submit",
      desc: agent.submittedAt ? "Submitted for review" : "Submit once everything above is complete",
      to: null,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow={`Welcome, ${session.name.split(" ")[0]}`}
        title={profile?.businessProfile?.companyName || "Your agency"}
        actions={<StatusBadge status={"bal:3000"} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          k="Profile completion"
          v={`${profilePct}%`}
          s={
            !profile
              ? "Loading..."
              : profilePct === 100
                ? "Complete"
                : profilePct === 0
                  ? "Incomplete"
                  : "In progress"
          }
        />
        <Stat
          k="Documents submitted"
          v={`${submittedCount}/${REQUIRED_DOCS.length}`}
          s={`${approvedCount} approved`}
        />
        <Stat
          k="Action required"
          v={
            <span
              className={
                hasActionRequired
                  ? "inline-flex rounded-md bg-red-100 px-3 py-1 text-sm font-bold text-red-700"
                  : "text-green-700"
              }
            >
              {hasActionRequired ? "Rejected" : "No action needed"}
            </span>
          }
          s={actionRequiredSubtitle}
        />
       
        <Stat
          k="Wallet balance"
          v={
            !agentId
              ? "—"
              : wallet.isPending
                ? "…"
                : wallet.data
                  ? fmtMoney(wallet.data.balance, wallet.data.currency)
                  : "—"
          }
          s={
            !agentId
              ? "Not linked"
              : wallet.isError
                ? "Couldn't load"
                : (wallet.data?.currency ?? "")
          }
        />
      </div>

      {vs !== "approved" && (
        <Card className="mt-6">
          <h2 className="font-display text-lg font-semibold">Onboarding checklist</h2>
          {vs === "action_required" && (
            <p className="mt-1 text-sm text-error">
              Some documents were rejected. Re-upload them from Documents.
            </p>
          )}
          <ol className="mt-4 divide-y divide-border">
            {steps.map((s, i) => (
              <li key={s.title} className="flex items-center justify-between gap-4 py-3">
                <div className="flex items-start gap-3">
                  {s.done ? (
                    <CheckCircle2 className="mt-0.5 size-5 text-success" />
                  ) : (
                    <Circle className="mt-0.5 size-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">
                      <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>{" "}
                      {s.title}
                    </div>
                    <div className="text-sm text-muted-foreground">{s.desc}</div>
                  </div>
                </div>
                {s.to ? (
                  <Link
                    to={s.to}
                    className="rounded-xl border border-input px-3 py-1.5 text-sm font-medium hover:bg-muted"
                  >
                    {s.done ? "Edit" : "Start"}
                  </Link>
                ) : (
                  !agent.submittedAt && (
                    <button
                      // disabled={!canSubmit}
                      onClick={() => {
                        submitForReview(agent.id);
                        toast.success("Submitted for review — verification is pending.");
                      }}
                      className="rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-40"
                    >
                      Submit
                    </button>
                  )
                )}
              </li>
            ))}
          </ol>
          {
            <dl className="mt-4 grid gap-2 rounded-2xl bg-background p-4 text-sm sm:grid-cols-2">
              {[
                ["Agency", profile?.businessProfile?.companyName || "—"],
                ["Type", profile?.businessProfile?.businessType || "—"],
                [
                  "Address",
                  [
                    profile?.businessProfile?.address,
                    profile?.businessProfile?.city,
                    profile?.businessProfile?.country,
                  ]
                    .filter(Boolean)
                    .join(", "),
                ],
                ["Currency", profile?.businessProfile?.currency || "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="eyebrow text-[10px]">{k}</dt>
                  <dd className="font-medium">
                    {v || <span className="text-error">Missing</span>}
                  </dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="eyebrow text-[10px]">Documents</dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {requiredDocuments.map((d) => {
                    const doc = latestDocuments.get(d.type);

                    return (
                      <span key={d.type} className="flex items-center gap-1 text-xs">
                        {d.label}
                        {doc ? (
                          <span className="inline-flex items-center gap-1.5">
                            {doc.verificationStatus.toUpperCase() === "REJECTED" && (
                              <AlertCircle size={18} className="shrink-0 text-red-600" />
                            )}
                            <span
                              className={
                                doc.verificationStatus.toUpperCase() === "REJECTED"
                                  ? "[&>span]:!px-3 [&>span]:!py-1 [&>span]:!text-sm [&>span]:!font-bold"
                                  : ""
                              }
                            >
                              <StatusBadge status={doc.verificationStatus.toLowerCase()} />
                            </span>
                          </span>
                        ) : (
                          <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Not uploaded
                          </span>
                        )}
                      </span>
                    );
                  })}
                </dd>
              </div>
            </dl>
          }
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent wallet transactions</h2>
            <Link to="/agent/wallet/transactions" className="text-sm text-primary-dark">
              View all
            </Link>
          </div>
          {agentId ? (
            wallet.isError ? (
              <ErrorState error={wallet.error} />
            ) : (
              <TransactionsTable q={tx} />
            )
          ) : (
            <WalletNotLinked />
          )}
        </section>
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold">Top-ups & bookings</h2>
          <PendingIntegration title="Top-up request history">
            The backend has no endpoint yet for listing an agent's own top-up requests. Submitted
            requests show their returned status on the top-up page.
          </PendingIntegration>
          <PendingIntegration title="Recent bookings">
            Booking APIs aren't connected yet.
          </PendingIntegration>
          <Link
            to="/agent/wallet/top-up"
            className="inline-block rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Request wallet top-up
          </Link>
        </section>
      </div>
    </>
  );
}

function Stat({ k, v, s }: { k: string; v: React.ReactNode; s: string }) {
  return (
    <Card>
      <div className="eyebrow text-[10px]">{k}</div>
      <div className="mt-2 font-display text-2xl font-bold">{v}</div>
      <div className="text-xs text-muted-foreground">{s}</div>
    </Card>
  );
}
