# Project context for Claude Code

You are working on **dappgo-stocks-shared** — pure-TypeScript shared
utilities for the DappGo Stocks family of mobile apps.

## What this is

A standalone npm package containing pure-TS helpers (no React, no React
Native dependencies) that BOTH `dappgo-tw-stocks-app` and
`dappgo-us-stocks-app` consume. See `src/index.ts` for the barrel
export of all 8 modules.

## Before you touch any code

1. Each util MUST have a matching `<name>.test.ts` next to it
2. Tests use `ts-jest` preset (configured in `package.json`)
3. No React, no React Native, no theme imports — pure TS only

## Before you finish

```bash
npx tsc --noEmit
npx jest          # 8 suites / 70+ tests
```

## Sync to consumer apps

After committing here, run from `dappgo-stocks-meta`:

```bash
cd ~/git/dappgo-stocks-meta
./scripts/sync-shared.sh
```

This copies the updated files into both apps' `src/utils/` directory.

## DappGo Stocks family

This repo is part of the **DappGo Stocks** family. The coordination repo
[`dappgo-stocks-meta`](https://github.com/laiyanlong/dappgo-stocks-meta)
holds STACK.md, CLAUDE.md, ARCHITECTURE.md, CONVENTIONS.md,
UI_DESIGN_SYSTEM.md, LAYOUT_PATTERNS.md, WORKFLOW.md,
INTEGRATION_STRATEGY.md, RELEASE.md, ONBOARDING.md, DEPENDENCY_FLOW.md
+ 9 cross-repo scripts.
