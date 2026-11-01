# Dictionary search, 2026-11-01

The plan's gap: `/dictionary/search` exists on the live site, word pages are static, and the budget is 0 JS. `AGENTS.md` asks for a decision record for any new on-demand route.

**Decision:** a plain GET form to the Worker, which searches an index bundled into its own code and fills the prerendered `/dictionary/search` file. No Supabase read, no script, `noindex` as today.

| Question | Answer |
|---|---|
| What it searches | Every word with a page: its stored meaning, and for an Arabic query its letters with marks removed. That bare copy is for comparing only and is never shown |
| Results | Exact meaning first, then starts-with, then contains, 40 at most, as on the old site |
| Bundle | 13,627 entries, 766 KB in `dist/server/entry.mjs`, which is also the redirect table, so it costs nothing extra |
| Freshness | The index is built from the same snapshot as the pages |

**Not measured yet:** CPU on the real platform. Check `wrangler tail` on the preview: the plan's limit is p50 under 10 ms, and if a scan of 13,627 entries goes over, cut the route and rely on letter pages. Live usage is unknown, since GA4 was never read.
