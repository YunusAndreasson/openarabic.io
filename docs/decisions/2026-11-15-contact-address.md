# Contact address: the project's own

2026-11-15. Replaces D10 in `2026-10-31-plan-decisions.md`, which had the site publish `yunus@edenmind.com` instead of `support@openarabic.io`.

## Decision

- **`/contact`:** `contact@openarabic.io`.
- **`/terms`, `/privacy`, `/account-deletion`:** `support@openarabic.io`. The deletion link keeps its `Account Deletion Request` subject.
- Still no form and no third party: a plain `mailto:` link, 0 JS.
- The privacy page's "Last updated" date moves to November 15, 2026, because it names the address.

## Why

The owner asked for it on 2026-11-15. Since then, both addresses:

- **Arrive:** Cloudflare Email Routing has rules for both, plus a catch-all, forwarding to the owner's Workspace inbox.
- **Can be answered from:** both are Workspace aliases, so replies go out from the address a reader wrote to.
- **Pass mail checks:** openarabic.io has Google DKIM, an SPF record that includes both Google and Cloudflare, and DMARC `p=reject`.
- **Are sorted:** Gmail files them under the OpenArabic project label.

Publishing the owner's personal address no longer gains anything, and it mixed OpenArabic mail in with everything else.
