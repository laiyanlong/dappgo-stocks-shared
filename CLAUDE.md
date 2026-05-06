# dappgo-stocks-shared

> **Part of the [DappGo Stocks family](https://github.com/YanlongLai/dappgo-stocks-meta) (14 sibling repos).**
> If you've never worked on this family before, read `~/git/dappgo-stocks-meta/CLAUDE.md` first — it's the canonical entry point.

## Family quick links
- Repo map: `~/git/dappgo-stocks-meta/docs/REPO_MAP.md` — what each repo does
- Dependency flow: `~/git/dappgo-stocks-meta/docs/DEPENDENCY_FLOW.md` — when changing X, also touch Y
- Architecture: `~/git/dappgo-stocks-meta/docs/ARCHITECTURE.md` — data flow + diagrams
- Conventions: `~/git/dappgo-stocks-meta/docs/CONVENTIONS.md` — TS / Python / commit standards

## This repo's role
**Tier 4** | **TypeScript 5.9 (no React, no RN)** | Pure-TS utilities shared by all 3 mobile apps. Single source of truth for verdict labels, formatters, days-until math, insider-direction classifier, SEC form colors, MA computation, sector aggregation, ticker aggregation, contribution bars, percentage bars, chart axis math, commentary cleanup, summarize-ticker, dashboard summary, regime display, design tokens.

- **Inputs**: nothing — leaves of the dependency tree.
- **Outputs**: `src/index.ts` barrel + per-module `package.json#exports`. Consumed by 3 apps via `file:../dappgo-stocks-shared`.
- **When to touch**: any logic used by ≥2 apps; new verdict label / insider classification / formatter; new design token.

## Sibling repos commonly edited together
- `~/git/dappgo-tw-stocks-app`, `~/git/dappgo-us-stocks-app`, `~/git/dappgo-options-app` — all 3 link this via `file:`.
- `~/git/dappgo-stocks-meta` — `scripts/sync-shared.sh` mirrors files into apps' `src/utils/` for legacy migrating call sites.

> After every change here, restart Metro in any open app or run `~/git/dappgo-stocks-meta/scripts/sync-shared.sh`. If your change ripples to sibling repos, see `DEPENDENCY_FLOW.md`.

## Local commands

```bash
npm test                # jest (ts-jest preset, ~380 tests)
npx tsc --noEmit        # type gate
```

---

## What this is

A standalone npm package containing pure-TS helpers (no React, no React
Native dependencies) that ALL 3 DappGo apps consume. See `src/index.ts`
for the barrel export.

## Before you touch any code

1. Each util MUST have a matching `<name>.test.ts` next to it
2. Tests use `ts-jest` preset (configured in `package.json`)
3. No React, no React Native, no theme imports — pure TS only

## Before you finish

```bash
npx tsc --noEmit
npx jest
```

## Sync to consumer apps

After committing here, run from `dappgo-stocks-meta`:

```bash
cd ~/git/dappgo-stocks-meta
./scripts/sync-shared.sh
```

This copies the updated files into apps' `src/utils/` directory (legacy
migration aid; new call sites import directly via `file:` link).
