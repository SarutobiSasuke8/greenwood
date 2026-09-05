# Method

Greenwood answers one question about every title on Robinhood Chain: is this a game, or a ticker with art?

## Criteria and weights

| Criterion | Weight | Rule |
|---|---|---|
| Playable build | 0.30 | 0 if the site does not serve a page or none is recorded. 100 playable without the token. 55 site live, playability not established. 30 site live, nothing playable. Minus 25 if token-gated. |
| Team visibility | 0.15 | 10 anonymous · 45 pseudonymous · 75 named individuals · 95 named entity. |
| Liquidity depth | 0.20 | Best pool USD: <100 → 0 (drained) · <10K → 20 · <50K → 45 · <250K → 70 · else 95. No pool → 0. |
| Holder spread | 0.15 | Top-ten share: ≤20% → 95 · ≤35% → 75 · ≤50% → 50 · ≤70% → 25 · else 10. Fallback by holder count (≥5000 → 70 · ≥1000 → 55 · ≥300 → 40 · ≥50 → 20 · else 5), marked `estimated`. |
| Ticker clarity | 0.20 | 0 collisions → 95 · 1 → 60 · 2 → 35 · ≥3 → 15. Capped at 30 without an attested contract. |

Total = Σ score × weight, rounded. Bands: sound ≥ 65 · watch 45–64 · avoid < 45 · unscreened for pre-launch.

## Flags

Playable · Site down · Token-gated · Pool drained · Thin liquidity · No market · Ticker collision / Ticker shared · Unattested token · Anonymous team · Top 10 hold N% · Partial data · Pre-launch. Each carries a `reason`.

## Data rules

1. Nothing is backfilled. Failed provider → null field, `partial: true`.
2. Contracts are attested, never matched by name or ticker.
3. Liveness is checked directly, one request per listing per refresh.
4. Every criterion returns a `basis` sentence.
5. Registry evidence is dated; full re-sweep every four weeks.

Implementation: `packages/core/src/screen.ts`. Tests: `packages/core/src/screen.test.ts`.
