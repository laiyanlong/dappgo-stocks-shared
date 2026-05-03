# dappgo-stocks-shared

> Pure-TypeScript shared utilities for the **DappGo Stocks** product family.

Single source of truth for logic shared between [dappgo-tw-stocks-app](https://github.com/YanlongLai/dappgo-tw-stocks-app) and [dappgo-us-stocks-app](https://github.com/YanlongLai/dappgo-us-stocks-app). No React, no React Native — pure functions + types only.

## Modules

| Module | Purpose |
|---|---|
| `verdict-label` | English verdict code → 繁中 label (BUY → 買進, HOT → 熱絡, …) |
| `verdict-explain` | Plain-language meaning + suggested action + risk band per verdict |
| `days-until` | Timezone-safe `YYYY-MM-DD` → days delta calculation |
| `insider-direction` | Classify net insider activity (`buying / selling / mixed / none`) |
| `sec-form-color` | SEC form type → semantic color (8-K red, 10-K gold, …) |
| `compute-ma` | Rolling simple moving average over OHLCV bars |
| `sector-aggregate` | Verdict counts + top gainer / loser per sector rotation |
| `ticker-aggregate` | Market sentiment summary across all tickers |

All modules are independently importable:

```ts
import { verdictLabel } from 'dappgo-stocks-shared/verdict-label';
import { computeMA } from 'dappgo-stocks-shared/compute-ma';
```

Or via the barrel:

```ts
import { verdictLabel, computeMA } from 'dappgo-stocks-shared';
```

## Use from a sibling app

```bash
cd dappgo-tw-stocks-app
npm install file:../dappgo-stocks-shared
```

Then update import paths from `'../utils/verdict-label'` to `'dappgo-stocks-shared/verdict-label'`.

> **React Native note**: Metro requires symlinks to be enabled (`watchFolders` config). For Expo SDK 54+ this is on by default. If you hit a "module not found", confirm `metro.config.js` includes the shared package's directory in `watchFolders`.

## Run tests

```bash
npm install
npm test
```

## Family

```
dappgo-stocks-shared (this) ← single source of truth
       ▲              ▲
       │              │
dappgo-tw-stocks-app  dappgo-us-stocks-app
```

## License

Proprietary. © DappGo.
