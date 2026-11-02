# Design reset, 2026-10-31

The owner rejected the first home page, which followed `DESIGN.md`, saying the current site looks far better and it isn't a promo like qamar360. Every automated check had passed, because they test rules and not whether a page looks good.

**Decision:** the owner called the rebuilt first screen, with a cinematic scene, logo, big headline, store badges and real app phones, "a good beginning". That direction replaces concept A as the structure of the page. Tapping a word stays as one section.

**How visual work now runs:**

1. Structure comes from the current openarabic.io. Quality comes from qamar360.com. Facts come from the `PRODUCT.md` ledger.
2. Claude directs Codex and critiques images before the owner sees them.
3. The owner sees each screen or section early, as a working page at http://127.0.0.1:4322.
4. Visual work isn't called good until it has been viewed beside those references.
5. `DESIGN.md` gets rewritten short afterwards, describing what was approved.

Still in force: `PRODUCT.md`, the owner review, tokens, Arabic text rules, `pnpm ship`, URL parity and budgets.

**Done 2026-11-02:** `DESIGN.md` was rewritten from 650 lines to about 225, describing what the owner approved. Strings its old `Story` section allowed moved to `docs/draft-copy.txt`.
