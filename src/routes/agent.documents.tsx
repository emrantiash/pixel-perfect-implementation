import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { StatusBadge } from "@/components/brand";
import { PageHeader, PanelShell, Skeleton } from "@/components/panel";
import { useAgent } from "@/components/agent-data";
import { uploadDoc } from "@/lib/mock/agents";

export const Route = createFileRoute("/agent/documents")({
  head: () => ({
    meta: [
      { title: "Verification documents — TripFlyer Agent" },
      { name: "description", content: "Upload your agency documents, track review status and replace rejected files." },
      { property: "og:title", content: "Verification documents — TripFlyer" },
      { property: "og:description", content: "Document review status for TripFlyer agents." },
    ],
  }),
  component: () => <PanelShell area="agent"><Docs /></PanelShell>,
});

const MAX = 5 * 1024 * 1024;

function Docs() {
  const { agent } = useAgent();
  if (!agent) return <Skeleton />;
  return (
    <>
      <PageHeader eyebrow="Onboarding" title="Required documents"
        description="PDF, JPG or PNG, max 5 MB each. Storage integration is pending — in development preview only the file name is recorded; the file itself is not uploaded." />
      <div className="divide-y divide-border rounded-[24px] border border-border bg-surface">
        {agent.documents.map((d) => (
          <div key={d.type} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3"><span className="font-medium">{d.label}</span><StatusBadge status={d.status} /></div>
              {d.fileName && <div className="mt-1 font-mono text-xs text-muted-foreground">{d.fileName} · v{d.version}{d.uploadedAt && ` · ${new Date(d.uploadedAt).toLocaleDateString("en-GB")}`}</div>}
              {d.status === "rejected" && d.reason && (
                <div className="mt-2 rounded-xl bg-clay-soft px-3 py-2 text-sm"><span className="font-medium text-error">Admin remarks: </span>{d.reason}</div>
              )}
            </div>
            {(d.status === "not_uploaded" || d.status === "rejected") && (
              <label className="cursor-pointer rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-dark">
                {d.status === "rejected" ? "Re-upload" : "Upload"}
                <input type="file" accept={d.type === "owner_photo" ? ".jpg,.jpeg,.png" : ".pdf,.jpg,.jpeg,.png"} className="sr-only" onChange={(e) => {
                  const f = e.target.files?.[0]; e.target.value = "";
                  if (!f) return;
                  if (f.size > MAX) { toast.error("File is larger than 5 MB"); return; }
                  uploadDoc(agent.id, d.type, f.name);
                  toast.success(`${d.label} recorded — pending review`);
                }} />
              </label>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
