import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusBadge } from "@/components/brand";
import { PageHeader, PanelShell, Skeleton } from "@/components/panel";
import { errorMessage } from "@/lib/api/client";
import { usersApi, type AgentDocument, type AgentDocumentType } from "@/lib/api/users";

export const Route = createFileRoute("/agent/documents")({
  head: () => ({
    meta: [
      { title: "Verification documents — TripFlyer Agent" },
      {
        name: "description",
        content: "Upload your agency documents, track review status and replace rejected files.",
      },
      { property: "og:title", content: "Verification documents — TripFlyer" },
      {
        property: "og:description",
        content: "Document review status for TripFlyer agents.",
      },
    ],
  }),
  component: () => (
    <PanelShell area="agent">
      <Docs />
    </PanelShell>
  ),
});

const MAX = 5 * 1024 * 1024;

const REQUIRED_DOCUMENTS: {
  type: AgentDocumentType;
  label: string;
  accept: string;
}[] = [
  {
    type: "NID",
    label: "National ID (NID)",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    type: "TIN_CERTIFICATE",
    label: "TIN Certificate",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    type: "CIVIL_AVIATION_CERTIFICATE",
    label: "Civil Aviation Certificate",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    type: "TRADE_LICENSE",
    label: "Trade License",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    type: "OWNER_PICTURE",
    label: "Owner's Picture",
    accept: ".jpg,.jpeg,.png",
  },
];

function Docs() {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<AgentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<AgentDocumentType | null>(null);

  async function loadDocuments() {
    const profile = await usersApi.getMyAgentProfile();
    const id = profile.businessProfile?.id;

    if (!id) {
      throw new Error(
        "Agent business profile not found. Please complete your business profile first.",
      );
    }

    setAgentId(id);

    const result = await usersApi.getAgentDocuments(id);
    setDocuments(result);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const profile = await usersApi.getMyAgentProfile();
        const id = profile.businessProfile?.id;

        if (!id) {
          throw new Error(
            "Agent business profile not found. Please complete your business profile first.",
          );
        }

        const result = await usersApi.getAgentDocuments(id);

        if (active) {
          setAgentId(id);
          setDocuments(result);
        }
      } catch (error) {
        if (active) toast.error(errorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  // If there are multiple records for a type, display the newest one.
  const latestByType = new Map<AgentDocumentType, AgentDocument>();

  for (const doc of [...documents].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )) {
    if (!latestByType.has(doc.type)) {
      latestByType.set(doc.type, doc);
    }
  }

  const submittedCount = REQUIRED_DOCUMENTS.filter((item) => latestByType.has(item.type)).length;

  async function handleUpload(type: AgentDocumentType, label: string, file: File) {
    if (!agentId) {
      toast.error("Agent profile is not available.");
      return;
    }

    if (file.size > MAX) {
      toast.error("File is larger than 5 MB.");
      return;
    }

    setUploadingType(type);

    try {
      await usersApi.uploadAgentDocument(agentId, {
        type,
        file,
      });

      await loadDocuments();
      toast.success(`${label} uploaded successfully and is pending review.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploadingType(null);
    }
  }

  if (loading) return <Skeleton />;

  return (
    <>
      <PageHeader
        eyebrow="Onboarding"
        title="Required documents"
        description="Upload PDF, JPG or PNG files, up to 5 MB each. Submitted documents are stored securely and reviewed by the TripFlyer team."
      />

      <div className="mb-5 rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium">Documents submitted</span>
          <span className="text-sm font-semibold">{submittedCount}/5</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(submittedCount / 5) * 100}%` }}
          />
        </div>
      </div>

      <div className="divide-y divide-border rounded-[24px] border border-border bg-surface">
        {REQUIRED_DOCUMENTS.map((item) => {
          const doc = latestByType.get(item.type);
          const status = doc ? doc.verificationStatus.toLowerCase() : "not_uploaded";
          const fileName = doc?.filePath?.split("/").pop();

          return (
            <div key={item.type} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium">{item.label}</span>
                  <StatusBadge status={status} />
                </div>

                {fileName && (
                  <div className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {fileName}
                    {doc?.createdAt && ` · ${new Date(doc.createdAt).toLocaleDateString("en-GB")}`}
                  </div>
                )}

                {doc?.verificationStatus === "REJECTED" && doc.remarks && (
                  <div className="mt-2 rounded-xl bg-clay-soft px-3 py-2 text-sm">
                    <span className="font-medium text-error">Admin remarks: </span>
                    {doc.remarks}
                  </div>
                )}
              </div>

              {(!doc ||
                doc.verificationStatus === "PENDING" ||
                doc.verificationStatus === "REJECTED") && (
                <label className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-dark">
                  {uploadingType === item.type ? "Uploading..." : doc ? "Re-upload" : "Upload"}

                  <input
                    type="file"
                    accept={item.accept}
                    disabled={uploadingType !== null}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";

                      if (file) {
                        void handleUpload(item.type, item.label, file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
