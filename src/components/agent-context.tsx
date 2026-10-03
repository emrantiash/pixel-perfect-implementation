import { Link } from "@tanstack/react-router";
import { setCurrentAgent, useAgentsStore } from "@/lib/mock/agents";

export function useCurrentAgent() {
  const s = useAgentsStore();
  return { agent: s.agents.find((a) => a.id === s.currentAgentId) ?? null, agents: s.agents };
}

/** Demo-only switcher until real agent login exists. */
export function NoAgent() {
  const { agents } = useCurrentAgent();
  return (
    <div className="rounded-[24px] border border-border bg-surface p-8 text-center">
      <h1 className="font-display text-2xl font-bold">No agent signed in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Register a new agency, or continue as a demo agency.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link to="/agent/register" className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Register agency</Link>
        {agents.slice(0, 3).map((a) => (
          <button key={a.id} onClick={() => setCurrentAgent(a.id)} className="rounded-xl border border-input px-4 py-2 text-sm font-medium hover:bg-muted">{a.businessName}</button>
        ))}
      </div>
    </div>
  );
}
