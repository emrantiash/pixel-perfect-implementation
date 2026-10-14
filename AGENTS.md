<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All backend calls go through `src/lib/api/client.ts` (`apiRequest`, base URL from `VITE_API_BASE_URL`) with typed modules like `src/lib/api/wallet.ts` — keeps auth headers and errors consistent.
- Auth goes through the adapter in `src/lib/auth.ts`; Clerk is the intended provider, and until it is wired in only a clearly-labelled dev preview session exists — never fake a real sign-in.
- Agent/admin pages wrap content in `PanelShell` (src/components/panel.tsx), which is a UI gate only; the NestJS backend must enforce auth and roles.
- `src/lib/mock/agents.ts` is labelled dev-preview data for agent profile/documents only until those backend APIs exist; wallet data is never mocked.
