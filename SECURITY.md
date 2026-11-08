# Security policy

openarabic.io has no accounts, but it's where people go to get the app, and
its Worker answers every request that a file can't: redirects, the store
links, dictionary search and the page counts. A hole here could change what
those visitors read or where the store buttons send them. Please report one
privately.

## Reporting a vulnerability

Use GitHub's private reporting:
[report a vulnerability](https://github.com/YunusAndreasson/openarabic.io/security/advisories/new).
Please don't open a public issue.

Include the URL, the request or steps, what happened, and what an attacker
would gain. A fix is coordinated with you before anything is published, and
you're credited in the advisory unless you'd rather not be.

## Supported versions

Only what openarabic.io serves today gets fixes. They ship as a new deploy of
`main`.

## Scope

In scope:

- the pages and the Worker on https://openarabic.io
- `pnpm ship` and `pnpm ship:rollback`, the only way this site is deployed
- this repository's workflows

Out of scope: the OpenArabic app and its database, which have their own
[security policy](https://github.com/YunusAndreasson/openarabic/security/advisories/new),
and Cloudflare, Supabase, Google Analytics or the app stores themselves.
Report those to their owners.
