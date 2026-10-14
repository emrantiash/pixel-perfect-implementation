import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api/client";
import { ConfirmDialog } from "@/components/panel";

type BackendDocument = {
  id: string;
  type: string;
  documentNumber?: string | null;
  filePath?: string | null;
  fileUrl?: string | null;
  verificationStatus: string;
  remarks?: string | null;
  createdAt?: string;
};

type BackendAgent = {
  id: string;
  companyName: string;
  businessType?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  currency?: string | null;
  verificationStatus: string;
  verificationRemarks?: string | null;
  user: {
    firstName?: string | null;
    lastName?: string | null;
    email: string;
    phone?: string | null;
  };
  documents: BackendDocument[];
};

function StatusLabel({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const styles: Record<string, string> = {
    APPROVED: "bg-success/10 text-success",
    REJECTED: "bg-error/10 text-error",
    PENDING: "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        styles[normalized] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

export function AgentReview({ agent }: { agent: BackendAgent }) {
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState<BackendDocument | null>(null);
  const [approving, setApproving] = useState<BackendDocument | null>(null);
  const [reason, setReason] = useState("");

  const [agentRejecting, setAgentRejecting] = useState(false);
  const [agentReason, setAgentReason] = useState("");
  const [agentApproving, setAgentApproving] = useState(false);

  const agentVerificationMutation = useMutation({
    mutationFn: async ({
      verificationStatus,
      remarks,
    }: {
      verificationStatus: "APPROVED" | "REJECTED";
      remarks?: string;
    }) =>
      apiRequest(`/users/agents/${encodeURIComponent(agent.id)}/verification`, {
        method: "PATCH",
        body: { verificationStatus, remarks },
      }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "agent", agent.id],
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin", "agents"],
      });

      toast.success(
        variables.verificationStatus === "APPROVED"
          ? "Agent approved successfully"
          : "Agent rejected successfully",
      );

      setAgentRejecting(false);
      setAgentReason("");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update agent verification");
    },
  });

  const verificationMutation = useMutation({
    mutationFn: async ({
      document,
      verificationStatus,
      remarks,
    }: {
      document: BackendDocument;
      verificationStatus: "APPROVED" | "REJECTED";
      remarks?: string;
    }) =>
      apiRequest(
        `/users/agents/${encodeURIComponent(agent.id)}/documents/${encodeURIComponent(document.id)}/verification`,
        {
          method: "PATCH",
          body: { verificationStatus, remarks },
        },
      ),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["admin", "agent", agent.id],
      });

      await queryClient.invalidateQueries({
        queryKey: ["admin", "agents"],
      });

      toast.success(
        variables.verificationStatus === "APPROVED" ? "Document approved" : "Document rejected",
      );
      setApproving(null);
      setRejecting(null);
      setReason("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update document verification",
      );
    },
  });

  const ownerName =
    [agent.user.firstName, agent.user.lastName].filter(Boolean).join(" ") || "Name not provided";

  return (
    <div className="rounded-[24px] border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">
            {agent.companyName || "Profile incomplete"}
          </h2>
          <div className="mt-1 text-sm text-muted-foreground">
            {ownerName} · {agent.user.email} · {agent.user.phone || "—"}
          </div>
          <div className="text-sm text-muted-foreground">
            {[agent.businessType, agent.address, agent.city, agent.country]
              .filter(Boolean)
              .join(", ") || "No business details yet"}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusLabel status={agent.verificationStatus} />

          {agent.verificationStatus.toUpperCase() !== "APPROVED" && (
            <button
              type="button"
              onClick={() => setAgentApproving(true)}
              disabled={agentVerificationMutation.isPending}
              className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              Approve Agent
            </button>
          )}

          {agent.verificationStatus.toUpperCase() !== "REJECTED" && (
            <button
              type="button"
              disabled={agentVerificationMutation.isPending}
              onClick={() => {
                setAgentReason("");
                setAgentRejecting(true);
              }}
              className="rounded-xl border border-error px-3 py-2 text-sm font-medium text-error disabled:opacity-50"
            >
              Reject Agent
            </button>
          )}
        </div>
      </div>

      {agent.verificationRemarks && (
        <p className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm">
          Agent verification remarks: {agent.verificationRemarks}
        </p>
      )}

      <div className="mt-6 divide-y divide-border">
        {agent.documents.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No documents have been uploaded for this agent.
          </p>
        ) : (
          agent.documents.map((document) => {
            const status = document.verificationStatus.toUpperCase();
            const busy = verificationMutation.isPending;

            return (
              <div
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium">{document.type.replaceAll("_", " ")}</span>
                    <StatusLabel status={document.verificationStatus} />
                  </div>

                  {document.documentNumber && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Document number: {document.documentNumber}
                    </p>
                  )}

                  {document.filePath && (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <span className="break-all font-mono text-xs text-muted-foreground">
                        {document.filePath}
                      </span>

                      <button
                        type="button"
                        onClick={async () => {
                          const tab = window.open("about:blank", "_blank");

                          try {
                            const result = await apiRequest<{
                              signedUrl: string;
                              expiresIn: number;
                            }>(
                              `/users/agents/${encodeURIComponent(agent.id)}/documents/${encodeURIComponent(document.id)}/url`,
                            );

                            if (!result.signedUrl) {
                              throw new Error("The backend did not return a document URL.");
                            }

                            if (tab) {
                              tab.location.href = result.signedUrl;
                            } else {
                              window.location.href = result.signedUrl;
                            }
                          } catch (error) {
                            tab?.close();

                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "Could not open the document",
                            );
                          }
                        }}
                        className="rounded-xl border border-input px-3 py-2 text-sm font-medium hover:bg-muted"
                      >
                        View document
                      </button>
                    </div>
                  )}

                  {document.remarks && (
                    <p className="mt-1 text-sm text-error">Remarks: {document.remarks}</p>
                  )}
                </div>

                {status === "PENDING" && (
                  <div className="flex gap-2">
                    <button
                      disabled={busy}
                      onClick={() => {
                        setReason("");
                        setRejecting(document);
                      }}
                      className="rounded-xl border border-input px-3 py-2 text-sm font-medium hover:bg-clay-soft disabled:opacity-50"
                    >
                      Reject
                    </button>

                    <button
                      disabled={busy}
                      onClick={() => setApproving(document)}
                      className="rounded-xl bg-success px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      Approve
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!approving}
        onOpenChange={(open) => !open && setApproving(null)}
        title={`Approve ${approving?.type.replaceAll("_", " ") ?? "document"}?`}
        description={
          <>
            This will save the document's approval status to the backend for{" "}
            <b>{agent.companyName}</b>.
          </>
        }
        confirmLabel="Approve"
        onConfirm={async () => {
          if (!approving) return;

          await verificationMutation.mutateAsync({
            document: approving,
            verificationStatus: "APPROVED",
          });
        }}
      />

      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
        title={`Reject ${rejecting?.type.replaceAll("_", " ") ?? "document"}?`}
        description="The rejection remarks will be saved to the backend."
        confirmLabel="Reject document"
        tone="danger"
        disabled={reason.trim().length < 5 || verificationMutation.isPending}
        onConfirm={async () => {
          if (!rejecting) return;

          await verificationMutation.mutateAsync({
            document: rejecting,
            verificationStatus: "REJECTED",
            remarks: reason.trim(),
          });
        }}
      >
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Reason (minimum 5 characters)"
          className="field"
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={agentApproving}
        onOpenChange={(open) => setAgentApproving(open)}
        title={`Approve ${agent.companyName}?`}
        description="This will approve the overall agent profile. All five required documents must already be approved."
        confirmLabel="Approve Agent"
        disabled={agentVerificationMutation.isPending}
        onConfirm={async () => {
          await agentVerificationMutation.mutateAsync({
            verificationStatus: "APPROVED",
            remarks: "Agent approved by admin.",
          });
          setAgentApproving(false);
        }}
      >
        <p className="text-sm text-muted-foreground">
          Please confirm that you have reviewed the agency and its required documents.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={agentRejecting}
        onOpenChange={(open) => {
          if (!open) setAgentRejecting(false);
        }}
        title={`Reject ${agent.companyName}?`}
        description="This rejects the overall agent profile, not an individual document."
        confirmLabel="Reject Agent"
        tone="danger"
        disabled={agentReason.trim().length < 5 || agentVerificationMutation.isPending}

        onConfirm={async () => {
          try {
            await agentVerificationMutation.mutateAsync({
              verificationStatus: "APPROVED",
              remarks: "Agent approved by admin.",
            });
            setAgentApproving(false);
          } catch {
            setAgentApproving(false);
          }
        }}
      >
        <textarea
          value={agentReason}
          onChange={(event) => setAgentReason(event.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Reason (minimum 5 characters)"
          className="field"
        />
      </ConfirmDialog>
    </div>
  );
}
