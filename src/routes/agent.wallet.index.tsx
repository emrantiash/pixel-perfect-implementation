import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, ErrorState, PageHeader, PanelShell, Skeleton } from "@/components/panel";
import { useAgent, useAgentTransactions, useWallet } from "@/components/agent-data";
import { TransactionsTable, WalletNotLinked } from "@/components/wallet-ui";
import { fmtDate, fmtMoney, walletApi } from "@/lib/api/wallet";

export const Route = createFileRoute("/agent/wallet/")({
  head: () => ({
    meta: [
      { title: "Wallet — TripFlyer Agent" },
      {
        name: "description",
        content: "Your TripFlyer agent wallet balance and recent transactions.",
      },
      { property: "og:title", content: "Wallet — TripFlyer Agent" },
      { property: "og:description", content: "Agent wallet balance and transactions." },
    ],
  }),
  component: () => (
    <PanelShell area="agent">
      <WalletPage />
    </PanelShell>
  ),
});

function WalletPage() {
  const { session } = useAgent();
  const id = session?.backendAgentId;
  const w = useWallet(id);
  const tx = useAgentTransactions(id, 1, 10);

  const topUps = useQuery({
    queryKey: ["agent-top-ups", id, 1, 10],
    queryFn: ({ signal }) => walletApi.getAgentTopUps(id!, 1, 10, signal),
    enabled: !!id,
    retry: false,
  });

  return (
    <>
      <PageHeader
        eyebrow="Finance"
        title="Wallet"
        actions={
          <div className="flex gap-2">
            <Link
              to="/agent/wallet/transactions"
              className="rounded-xl border border-input px-4 py-2 text-sm font-medium"
            >
              All transactions
            </Link>
            <Link
              to="/agent/wallet/top-up"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Request top-up
            </Link>
          </div>
        }
      />

      {!id ? (
        <WalletNotLinked />
      ) : w.isPending ? (
        <Skeleton rows={1} />
      ) : w.isError ? (
        <ErrorState error={w.error} onRetry={() => w.refetch()} />
      ) : (
        <Card>
          <div className="eyebrow text-[10px]">Current balance</div>
          <div className="mt-2 font-display text-4xl font-bold">
            {fmtMoney(w.data.balance, w.data.currency)}
          </div>
          <div className="mt-1 font-mono text-xs text-muted-foreground">
            {w.data.currency}
            {w.data.updatedAt && ` · updated ${fmtDate(w.data.updatedAt)}`}
          </div>
        </Card>
      )}

      {id && (
        <>
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Top-up request history</h2>
              <Link to="/agent/wallet/top-up" className="text-sm text-primary-dark">
                New request
              </Link>
            </div>

            {topUps.isPending ? (
              <Skeleton rows={2} />
            ) : topUps.isError ? (
              <ErrorState error={topUps.error} onRetry={() => topUps.refetch()} />
            ) : topUps.data.items.length === 0 ? (
              <Card>
                <p className="text-sm text-muted-foreground">
                  You haven't submitted any top-up requests yet.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {topUps.data.items.map((request) => (
                  <Card key={request.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {fmtMoney(request.amount, request.currency || "BDT")}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {request.method.replaceAll("_", " ")}
                          {request.transactionReference &&
                            ` · Ref: ${request.transactionReference}`}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Submitted: {fmtDate(request.createdAt)}
                        </div>
                      </div>

                      <span
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          request.status === "APPROVED"
                            ? "bg-green-100 text-green-700"
                            : request.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>

                    {request.status === "REJECTED" && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                        <div className="text-sm font-semibold text-red-800">
                          Top-up request rejected
                        </div>
                        <p className="mt-1 text-sm text-red-700">
                          {request.adminRemarks?.trim() ||
                            "Please contact the TripFlyer team for the rejection reason."}
                        </p>
                        <Link
                          to="/agent/wallet/top-up"
                          search={{
                            previousTopUpId: request.id,
                            amount: String(request.amount),
                            paymentMethod: request.method,
                            transactionReference: request.transactionReference ?? "",
                          }}
                          className="mt-3 inline-block rounded-lg bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                        >
                          Submit corrected proof
                        </Link>
                      </div>
                    )}

                    {request.status === "APPROVED" && (
                      <p className="mt-3 text-sm text-green-700">
                        Your wallet top-up was approved.
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </section>
          {tx.isSuccess && tx.data.items.length === 0 && (
            <div className="rounded-xl border border-dashed p-5 text-center">
              <h3 className="font-semibold">No wallet transactions yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Your transaction history will appear here once your first wallet transaction is
                recorded.
              </p>
              <Link
                to="/agent/wallet/transactions"
                className="mt-3 inline-block text-sm font-medium text-primary"
              >
                View all transactions
              </Link>
            </div>
          )}

          {/* {tx.data?.items && tx.data.items.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 font-display text-lg font-semibold">
                Recent wallet transactions
              </h2>
              <TransactionsTable q={tx} />
            </section>
          )} */}
        </>
      )}
    </>
  );
}
