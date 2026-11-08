# Contributing

Bug reports and pull requests are welcome. For anything bigger than a fix,
open an issue first, so we can agree on the shape before you write the code.

## Build and check

You need Node 26, the pnpm version pinned in `package.json`, and Chromium at
`/usr/bin/chromium`.

```sh
pnpm install --frozen-lockfile
pnpm dev          # http://localhost:4321, the home page only without a snapshot
pnpm ship:test    # the deploy's guards, end to end, on fixture data
```

Before a pull request:

- `pnpm ship:test` passes. It builds a whole site from fixture data with every
  network host faked, then runs the design lint, the size and lab budgets, the
  claims check and URL parity, so nothing reaches Supabase or Cloudflare.
- For a change to a page, the [DESIGN.md](DESIGN.md) `Review` rows it touches
  pass, in Firefox (or Zen) and Chromium, at 390×664, 375×553 and 1280×640.
- New public copy is in [PRODUCT.md](PRODUCT.md)'s ledger or DESIGN.md, or
  added to `docs/draft-copy.txt` for the owner to approve. The claims check
  fails on any sentence that traces to none of them.
- One change per pull request, with a commit message in the repository's
  style: `fix: …`, `feat: …`, `docs: …`, a lowercase sentence after the prefix.

## What the site won't do

Some of this is deliberate and changes to it need a strong case:

- It only promotes the app: no accounts, sign-up or admin.
- No UI framework and no islands. Every page but the home page stays under
  1.5 KB of gzipped JavaScript, and every page reads with JavaScript off.
- Stored Arabic is shown exactly as stored: never normalised, re-vocalised or
  stretched with kashida.
- App screens are real captures, cropped and scaled only. Photographs are
  generated and hold no lettering.
- It's dark at every size, with no light theme.
- Nothing deploys from CI. The owner runs `pnpm ship --production` by hand.

## Security issues

Not in issues or pull requests: see [SECURITY.md](SECURITY.md).

## Conduct and license

Everyone here follows the [Code of Conduct](CODE_OF_CONDUCT.md). By
contributing, you agree your code is released under the
[MIT license](LICENSE). The photographs, app screens, texts, audio and brand
marks it lists stay outside that license.
