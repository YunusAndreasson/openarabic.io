# openarabic-web

The Astro replacement for openarabic.io, in its foundation phase: no site code yet.
This file is a placeholder holding only the safety rules. It gets written properly
after the technical spikes.

## Hard rules

- **Never deploy to, rename or delete the Worker `openarabic-web`.** It serves the live openarabic.io and its admin panel. This repo's Worker is `openarabic-site`, set in `wrangler.jsonc`. Keep that file, because without it the adapter would name the Worker after this folder.
- **Never add a route or custom domain for openarabic.io.** The cutover happens only on the owner's explicit go.
- **The only deploy allowed in this phase is the throwaway sandbox Worker `openarabic-sandbox`:** noindexed and deleted afterwards. Run `wrangler deploy` with an explicit `--name` only for that.
- **Treat Supabase as production.** Read only, with throttled requests, and never print or commit keys.
