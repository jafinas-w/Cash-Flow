# Cashflow V2 — Build Phases

> **Purpose:** Working reference for prototype build order. Update status markers as each build completes.
> **Last updated:** Apr 29, 2026 — All Phase 1 builds complete (1, 2, 2.1, 3.1, 3.2, 3.3) plus unlinked-user flow wiring, negative-state refinements (D10 shortfall framing on hero; Smart Actions carousel with Instacash + savings transfer), state-switcher cleanup, and MLDS canonical token migration (Baton Turbo + 3.0 color ramp now live in the prototype). Full V2 prototype is live: Splash (link-state aware CTA) → A1 Linking gate (auto-progresses on success) → A2 Overview → A3 Confirm Bills (optional) → Dashboard with all 7 sections and 4 hero states. Polish layer (state transition animations) deferred to a hand-off conversation with eng.
> **Owner:** Jaf Inas
> **Companion files:**
> - `phases.md` — Phase 1 strategic brief (what we're building, why, who for)
> - `flow.md` — Screen-by-screen breakdown (Phase A locked; Phase B section *not yet appended* — current Phase B spec lives across `dashboard-exploration.md` + Build 2 / 2.1 / 3.x sections of this file. Tracked as open follow-up.)
> - `dashboard-exploration.md` — Phase B concept exploration (Concept 3 selected)

---

## How to read this file

**Status markers:** ✅ Complete · ⚠️ Partial · ⬜ Not started · 🔄 In progress

**Complexity:** 🟢 Low · 🟡 Medium · 🔴 High

**Build order logic:** Builds are sequenced by three rules — (1) lock before build (no building against open specs), (2) screens with the most user-facing certainty come first, (3) the highest-risk visual element (state-adaptive hero) is resolved before the sections that depend on its layout.

**Naming convention:** *Phase A / Phase B* refers to design-spec lock phases (Phase A = onboarding flow locked; Phase B = dashboard composition locked). *Build 1 / 2 / 3* refers to prototype build sequence. They are sequential — both phases lock before any build starts.

---

## Decision Log (Locked)

All decisions below are confirmed. No further alignment needed before building.

| Ref | Decision |
|---|---|
| D1 | Design optimizes for the 85% of users with a bv-linked account. The 15% unlinked path is a gate (A1), not a degraded experience. |
| D2 | No typed manual entry in Phase 1. Bills are added only by selecting from detected transactions (A3.1 picker). |
| D3 | Bill list (A3) is read-only in Phase 1. No edit, no delete, no rename, no amount/date change. Mis-detected bills are a Phase 2 fix. |
| D4 | Bill confirmation (A3) is optional. The user can land on the dashboard without ever opening this screen. |
| D5 | Splash carousel CTA is persistent across all 3 pages. Carousel is enrichment, not a gate. Page 1 must stand on its own. |
| D6 | Detection can take up to 24 hours after first link. Dashboard silently updates when detection completes. No notification, no celebration moment in Phase 1. |
| D7 | Confidence tag is a system addition. Variants: `(none)` for high confidence · `Partial estimated` for missing-but-detection-complete · `Building your view` for in-flight detection · `Limited info` for post-24h-no-detection. |
| D8 | Dashboard hero is Concept 3 (state-adaptive) with Concept 1's hero as the positive-STS variant. ~~Three hero shapes: Positive (number + chart), Cover-First (negative STS), Learning-First (low confidence / Building).~~ **The "three shapes" framing was superseded Apr 28 2026 by D9b** — one hero shell, four state-driven data sets. The Concept 3 spirit (state adaptivity) is preserved; the implementation collapsed to a single shell. |
| D9 | ~~Stateful surface treatment: dark for Positive STS, warm contextual (Yellow-100 family) for Negative STS, light neutral for Low confidence and Building.~~ **Superseded Apr 28 2026** by D9b — unified dark hero shell across all four states. See "Build 2 revision — Unified hero shell" below. |
| D9b | **Unified hero shell.** Same dark surface (Neutral-1000), same `BalanceChart`, same 3 metric tiles in every state. Only the big number, sub-line color, chart trajectory, and chart mode change with state. Reduces "different screen each open" feel; chart's visual continuity carries the state signal. |
| D10 | Negative STS framing: `$45 short until Friday`. Literal STS number stays as a smaller secondary line for transparency. Never `-$45.20 Safe to Spend` as the hero. |
| D11 | Phase 1 Smart Action triggers: (1) STS negative or projected negative within 3 days → Cover; (2) Bill due <3 days + STS insufficient → Cover. Both Cover-pillar. |
| D12 | Direct deposit nudge lives in the Improve section, not as a Smart Action. Smart Actions feel reactive to crisis, not promotional. |
| D13 | Surplus/Grow Smart Actions deferred to Phase 2. Phase 1 dashboard does not surface savings or investment actions. |
| D14 | Splash is shown once per user lifetime. No re-onboarding flow in Phase 1. |
| D15 | Returning users skip the Overview screen and land on the dashboard. Overview is reachable via the Improve forecast link on the dashboard. |
| D16 | No demo / preview dashboard for unlinked users in Phase 1. Linking gate (A1) is the only path past the splash for unlinked users. |
| D17 | ~~Section ordering varies by state.~~ **Superseded Apr 28 2026** by D17b. |
| D17b | ~~Section ordering uniform with Bills first.~~ **Superseded Apr 28 2026** by D17c. |
| D17c | **Smart Actions pinned to section position 1 in every state.** Order: `Hero → Smart Actions → Bills → Income → Recap → Spending → Activity → Improve`. Smart Actions sits immediately below the hero in every state. State drives section *content* and *surface treatment*, not position. Negative state Smart Actions card uses a Teal-100 outer surface for visual emphasis. Empty Smart Actions in Positive (`All clear · no actions needed`) is a peak-end positive moment, not dead space. Low confidence trims to `Hero → Smart Actions → Bills → Activity → Improve` since Income / Recap / Spending have no data to render. |
| D18 | ~~Negative STS hero uses warm contextual surface (Yellow-100). Positive STS hero is the only dark surface in the entire V2 flow.~~ **Superseded Apr 28 2026** by D18b. |
| D18b | Light mode is default for all V2 screens (per MLDS). The dashboard hero is the only dark surface in the entire V2 flow, and it stays dark across all four states (per D9b unified hero). All other surfaces — including the Smart Actions Teal-100 emphasis treatment in negative state — are light. |
| D19 | **Overview → Dashboard routing.** A2 Overview detection state determines which Dashboard hero the user lands on. Mapping: `High → Positive STS`, `Partial → Negative STS`, `Building → Building (24h)`, `Low → Low confidence`. In production, High/Partial fork on the STS calculation; the prototype uses a stable demo-friendly mapping so each Overview state has a clear, deterministic counterpart for stakeholder walk-throughs. State Switcher remains the source of truth for any direct combination demos (e.g., High + Negative). |

---

## Open Items (Pending External Input or Research)

| Ref | Item | Owner | Needed for |
|---|---|---|---|
| O1 | Comprehension test for `Partial estimated` chip — does it read as transparency, or as broken-product? 6-8 Stretched-segment users on static Figma. | Research / Design | Validates Build 2 hero direction |
| ~~O2~~ | ~~Splash carousel pages 2 and 3 content~~ — **resolved Apr 28**. See/Cover/Grow direction locked in `flow.md`. | — | — |
| O3 | Mis-detected bill handling. Phase 1 has no remove/edit. Need instrumentation plan to surface frequency. | PM / Analytics | Phase 2 |
| ~~O4~~ | ~~Reduced-motion handling for stateful surface color shifts.~~ **Resolved Apr 28** when D9 was superseded by D9b. The unified hero shell has no surface-color shift between states. The remaining state-driven color change — Smart Actions card surface flipping between white and Teal-100 — is a static state, not an animated transition; reduced-motion is a non-issue. | — | — |
| O5 | Splash dismiss-and-resume behavior. Does first-time flag persist if user backs out mid-carousel? | PM | Build 1 |
| ~~O6~~ | ~~Activity timeline content for Phase 1.~~ **Resolved Apr 28** in Build 3.3. Phase 1 scope locked to "recent transactions" (last 5 across linked accounts, signed amounts, relative time, See-all-activity link). Smart Action lifecycle feed deferred to Phase 2 once Smart Actions earns engagement. | — | — |
| ~~O7~~ | ~~Recap section content for Phase 1.~~ **Resolved Apr 28** in Build 3.2. Three-row scope locked: Spent / Expected, Bills on time, vs last cycle. PM can extend in Phase 2. | — | — |

---

## Build 0 — Foundation ✅

**Current state of the prototype directory**

| Asset | Status | Notes |
|---|---|---|
| `prototypes/CashFlowV1Draft.canvas.tsx` | ✅ Frozen | V1 prototype. Do not modify. Reference only. |
| `prototypes/CashFlowV2Draft.canvas.tsx` | ✅ All Phase 1 builds complete | V2 target file (~3,700 lines). Full Phase 1 V2 prototype: Splash → Linking → Overview → Confirm Bills → Dashboard with all 7 real sections (Smart Actions, Bills, Income, Recap, Spending, Activity, Improve) and 4 hero states. Low confidence hero now shows the linked-account balance ($500) instead of an em-dash. Wired into `cashflow-prototype/` Vite app via `main.tsx` and `vite.config.ts` resolve aliases. |
| `features/cash-flow-v2/phases.md` | ✅ | Phase 1 brief. |
| `features/cash-flow-v2/flow.md` | ⚠️ Partial | Phase A locked. Phase B section pending Build 2 sign-off. |
| `features/cash-flow-v2/dashboard-exploration.md` | ✅ | Concept 3 + Concept 1 hero locked. |
| `features/cash-flow-v2/build-phases.md` | ✅ | This file. |

---

## Build 1 — Phase A Onboarding Flow 🟢 ✅

**Why first:** Phase A is fully locked. Lowest design risk, ships visual quality on a known-good spec, gets the most-reviewed screens (Splash, Overview) in front of stakeholders fastest. Phase A also doesn't depend on dashboard decisions, so it can be built independently.

**Goal:** A reviewable, single-canvas prototype of every onboarding screen with all locked detection-state variants. Stakeholders can demo any state without flowing through.

### Scope

| Screen | States to render | Notes |
|---|---|---|
| A0 — Splash carousel | All 3 pages | Page 1 copy locked. Pages 2 & 3 use placeholder copy until O2 resolves; flag `[copy TBD]` in the prototype. CTA persistent. |
| A1 — Linking gate | Default, Loading, Error toast | Compact illustration. Short, functional. |
| A2 — Overview | High confidence (all 3 detected, expanded) · Partial (paycheck or bills missing) · Building (detection in flight) · Low confidence (24h+, nothing detected) | Same screen, four states. State switcher in dev. |
| A3 — Confirm bills | Default (bills detected, read-only) · Empty / Building (detection still running) | No edit/delete affordances on rows. |
| A3.1 — Transaction picker | Default · Empty / Building · Bill-added confirmation toast | Tap-to-add only. Sticky 24h footer microcopy. |

### Out of scope for Build 1
- Dashboard renders as a placeholder card with copy: `Dashboard — Build 2 pending`. CTA from A2 routes here so the flow has a landing point.
- Confidence chip pattern is rendered statically per state. Tappable explainer (bottom sheet) deferred to Build 2 where the chip pattern is also used on the dashboard hero.
- Real linking flow is out of scope. A1's `Link your bank` button shows a 1.5s loading state and routes to A2 with the `Building your view` state pre-set.

### Expected output
- `prototypes/CashFlowV2Draft.canvas.tsx` — single canvas file, dev-mode state switcher visible at top of screen for stakeholder demos.
- All MLDS tokens from `MLDS-4_0-Reference.mdc` mapped to CSS variables. DM Sans for prototype (note the Baton Turbo substitution).
- Light mode only.

### Estimated size
800–1,000 lines.

### MLDS components used
- `Navigation Bar 3.0`
- `Accordion 3.0` (Overview pillar rows)
- `List 3.0` (account rows, bill rows, transaction rows, Improve recommendations)
- `Badge 3.0` Standard/Success size S (`Recommended`, confidence chips)
- `Button 3.0` Primary Large, Transparent Large, Small Icon-only
- `Sticky Note 3.0` (Add bill toast with undo)
- `Progress/Linear` indeterminate (loading state on Overview)
- Skeleton patterns (`Gradient/Skeleton-light`)
- Custom illustrations (splash hero — placeholder via lucide-react until illustration assets land)

### System additions introduced
- Confidence chip — designed once, used on Overview pillar headers and (Build 2) on Dashboard hero. Variants: Teal-100/Teal-900 for `Partial estimated`, Yellow-100/Yellow-700 for `Building your view`, Neutral for `Limited info`.

### Risk to validate post-Build 1
Splash drop-off rate per page. If the carousel is rarely swiped past page 1, kill pages 2 and 3 and ship a single splash page. Worth instrumenting from day one of any production build.

### Build 1 actuals (post-completion)

| Item | Notes |
|---|---|
| File size | ~1,800 lines (above 800–1,000 estimate; expansion driven by state variants and inline styling per MoneyLion prototype convention) |
| Dependencies added | `lucide-react` to `cashflow-prototype/package.json` |
| Vite config | `resolve.alias` added for `react`, `react-dom`, `react/jsx-runtime`, `react/jsx-dev-runtime`, `lucide-react` so the external `prototypes/` file resolves correctly. `server.fs.allow` extended to parent. `optimizeDeps.include: ['lucide-react']`. |
| TS config | `cashflow-prototype/tsconfig.app.json` extended `include` to point at the V2 file. |
| App entry | `cashflow-prototype/src/main.tsx` swapped to render V2 (legacy `App.tsx` preserved untouched, can be restored anytime). |
| Figma alignment patch | A2 Overview pillar icons differentiated by *detection status* (post-Build 1 correction): bank always confirmed; paycheck and bills show confirmed (filled black + check) when detected, indeterminate (red minus) when missing. Meta text carries the same semantics. Bank account rows use brand-colored avatars. "More ways to improve your cash flow" wrapped in collapsible card. Bills meta updated to `$850/mo detected`. Headline tightened to 28px / -1px tracking. |

---

## Build 2 — Dashboard Hero, All Four States 🟡 ✅

**Why second:** The hero is the highest-risk visual decision in the entire V2 spec. Stateful surface treatment (D9), Concept 3 layout swap (D8), and the Cover-First negative state (D10) are all unproven design moves. Resolve them visually before committing to seven sections that depend on the hero's layout grid.

**Goal:** A reviewable dashboard with all four hero states cleanly designed. Sections below the hero render as labeled placeholders so the layout's vertical rhythm is felt without committing to section content.

### Scope

| Hero state | Trigger | Surface | Hero content |
|---|---|---|---|
| Positive STS | High confidence + STS > 0 | Dark (Neutral-1000) | Title `Safe to Spend as of Apr 21` · Number `$1,606.80` (Display Md) · Line chart · 3 metric tiles below chart |
| Negative STS | High confidence + STS ≤ 0 | Warm (Yellow-100 family) | Title `$45 short until Friday` · Secondary line `Your $1,200 paycheck arrives Apr 28` · Smart Action card pinned directly below |
| Building | Detection in flight | Light neutral | Title `We're learning your patterns` · Body `Your dashboard will be ready within 24 hours of linking.` · Shows known data (bank balance, last detected paycheck) |
| Low confidence | 24h+ post-link, no detection | Light neutral | Title `We need a bit more to see your full picture` · CTA back to Overview |

State switcher visible in dev mode for stakeholder demos.

### Below-hero treatment for Build 2
All seven sections (Bills, Smart Actions, Income, Recap, Spending, Activity, Improve) render as labeled empty cards with section title + skeleton row. Real content lands in Build 3.

### Expected output
- `prototypes/CashFlowV2Draft.canvas.tsx` updated. All Build 1 onboarding screens still functional. Dashboard placeholder from Build 1 replaced with the four-state hero.
- Recharts line chart for Positive state. Custom curve, MLDS color tokens, gradient under the line.
- Confidence chip from Build 1 applied to the hero where applicable.

### Out of scope for Build 2
- Smart Action card *content* in Negative state — render the card as a styled placeholder ("Cover the gap to Friday — Smart Action card content lands in Build 3"). Surface treatment and position are decided here; copy and integration come later.
- Section content below the hero.
- Real data fluctuation. Mock data only.
- Animation between hero states (state switcher snaps; reduced-motion respected — see O4).

### Estimated size
600–800 lines added on top of Build 1.

### MLDS components used
- `Banner cards` patterns for hero card composition (Carousel banner card 3.0 reference dimensions)
- `Indicator 3.0`, `Badge 3.0` for chips
- Recharts (line chart with gradient fill)
- All MLDS components carried from Build 1

### System additions introduced
- Stateful surface pattern. Documented in Build 2 as a Cashflow-specific implementation; broader MLDS system rollout (whether other features adopt stateful hero color) is out of scope.
- Smart Action card placeholder shape (final card pattern lands in Build 3).

### Risk to validate post-Build 2
The "dashboard feels different each time I open it" reaction. Validate with users before Build 3 commits to building all sections under each state. If the surface shift reads as jarring or alarming, retrench to a single neutral hero with state-driven content only.

### Convergence checkpoint with PM/CPO
Build 2 is the right point to share with the CPO. Before Build 3 layers in seven more sections, get CPO sign-off on the state-adaptive hero direction and the negative-STS treatment. This is the one decision that, if reverted, costs the most downstream.

### Build 2 actuals (post-completion)

> **Note:** This actuals table describes the *original* Build 2 implementation (four distinct hero components, stateful surface treatment, pinned Smart Action card in negative state). Within the same day, all four were superseded by the unified hero (Build 2 revision) and the section-system Smart Actions card (Build 3.1 / 3.2). For current state, jump to "Build 2 revision — Unified hero shell" and "Build 3.x" sections below. Kept here as historical record.

| Item | Notes |
|---|---|
| File size | ~2,310 lines total (~500 lines added) |
| Dependencies added | None. Recharts skipped — chart drawn in raw SVG (smooth cubic bezier path + gradient fill) to keep the prototype self-contained and avoid the install-path issues we hit with `lucide-react` in Build 1. Recharts can swap in during Build 3 if interactivity is needed. |
| New components (since superseded) | `BalanceChart` (SVG, kept), `MetricTile` (kept), `PositiveHero` / `NegativeHero` / `BuildingHero` / `LowConfidenceHero` (collapsed into `DashboardHero` in Build 2 revision), `SmartActionPinned` (removed in Build 3.1), `SectionPlaceholder` (removed in Build 3.3), `DashboardScreen` (kept). |
| Hero state map (original, since superseded by D9b) | Positive (dark Neutral-1000) · Negative (Yellow-100 surface) · Building (white card) · Low confidence (white card with CTA pair). All four collapsed into one dark shell in the Build 2 revision. |
| Section ordering (original, since superseded by D17c) | Negative pinned `SmartActionPinned` inline; Bills surfaced second. Other states used `Bills → Smart Actions → Income → Recap → Spending → Activity → Improve`. |
| State switcher | Extended with 4 dashboard buttons (`Positive STS`, `Negative STS`, `Building (24h)`, `Low confidence`). Switcher footer copy updated. |
| Routing | Low confidence callout `Add a bill` / `Review what we have` route back to `ConfirmBillsScreen` (A3). Dashboard back button returns to Overview (A2). |
| Linter | 4 IDE-only "cannot find module" warnings on `react`/`lucide-react`/`react/jsx-runtime` (file lives outside `cashflow-prototype/src/`, resolved at runtime via Vite alias config). No new lint errors introduced by Build 2. |

### Build 2 revision — Unified hero shell (Apr 28 2026)

**Decision:** The hero shell is now identical across all four states (same dark surface, same chart, same 3 metric tiles). Only the data and accent color change with state. Replaces the original "stateful surface treatment" plan in D9.

**Why the revision:** Four different surface treatments (dark / yellow / white card / white card) created a "different screen each time I open it" experience. A unified shell with state-driven data communicates the same idea — *we read your situation and the dashboard adapts* — without making the surface feel unstable. Cognitive-load cost is lower, the chart's visual continuity carries across states, and stakeholders see one cohesive product instead of four design exercises.

**Implementation:**

> Final values after Build 3.3. Building / Low rows updated when `ChartMode` was simplified in 2.1 and the low-state hero was re-anchored to the linked-account balance in 3.3.

| State | Header label | Big number | Sub-line | Chart mode | Tiles |
|---|---|---|---|---|---|
| Positive | `Safe to spend` | `$1,606.80` (white) | `+$120 vs last cycle at this point` (teal) | filled | $1,780 / $340 / 11d |
| Negative | `Safe to spend` | `-$45.00` (red) | `Short before Friday · Paycheck arrives Apr 28` (red) | filled | $1,200 / $340 / 8d |
| Building | `Safe to spend` | `Building` (white at 88%) | `Live forecast within 24 hours of linking` (yellow) | filled (with empty events array → renders empty-state pill) | Detecting / Detecting / — |
| Low | `In your accounts` | `$500.00` (white) | `Add a bill or paycheck below to forecast safe to spend` (yellow) | skeleton | Safe to spend (—) / — / — |

**Architectural changes:**
- 4 hero components collapsed into 1 (`DashboardHero` with state-driven `HERO_DATA` map).
- `BalanceChart` extended with `mode: "filled" | "partial" | "skeleton"` and `lineColor` props. Renders dashed zero baseline when data crosses zero.
- New `LowConfidenceCallout` card sits below the hero in low state — preserves the `Add a bill` / `Review what we have` CTAs that were previously in-hero.
- `ConfidenceChip` no longer used on the dashboard hero. Sub-line color now carries the state context.

**Net file impact:** ~50 net lines removed from prototype, ~150 added for state data + chart modes. Total file: ~2,650 lines.

### Build 2.1 — Forward-only event chart (Apr 28 2026)

**Decision:** The hero chart now shows **today on the left, forward-only**, with discrete event pills (`Payday`, `Bills`) marking transactions on the curve. Replaces the cycle-spanning past+future chart from Build 2.

**Why the revision:**
1. Matches MoneyLion's brand promise (`See your future clearly. Stay ahead.`) — past data doesn't answer "how do I make it to payday?"
2. Turns abstract trajectory into a story — the curve dips because of *this specific bill*, the curve rises because of *that paycheck*. The Stretched user thinks event-by-event, not curve-by-curve.
3. Negative state becomes legible — the dip below zero now happens between two named events; the user sees exactly which bill pushes them under.
4. Past-cycle context preserved via the sub-line (`+$120 vs last cycle at this point`) and (in Build 3) a Cycle Recap section.

**Locked design decisions for Build 2.1:**

| # | Decision | Resolution |
|---|---|---|
| 1 | Daily budget chip | **Removed.** Decision to revisit if user testing shows demand. |
| 2 | Event pill labels | **Signed amounts above the pill** (`+$1,200`, `-$300`). Pill carries the categorical label only (`Payday`, `Bills`). Avoids balance-vs-delta ambiguity. |
| 3 | Past data treatment | Sub-line carries comparison; full past context lives in the Build 3 `Cycle recap` section. Hero chart is forward-only. |
| 4 | Building state chart | Today-on-left preserved. Curve shows a dashed flat projection at current balance with an inline `Forecast lands in 24h` pill in the middle of the chart area. |
| 5 | Low confidence chart | Today-on-left preserved. Flat dashed skeleton curve at 28% opacity. `LowConfidenceCallout` card below hero stays. |
| 6 | Pill color mapping | `Payday` = filled Teal-600 with black text (inflow = brand color = "good thing coming"). `Bills` = neutral white-at-16% with white text (outflow = neutral fact, **not** red). Red is reserved for the negative-STS curve crossing zero. |

**Architectural changes:**

- New types: `CashflowEvent` (signed amounts, day index, type), `ChartConfig` (start balance, total days, events, x-axis labels). Replaces `TrajectoryPoint[]`.
- `BalanceChart` rewritten to:
  - Compute running balance from start + events (no more pre-computed point arrays)
  - Render today dot at the **left edge** instead of mid-chart
  - Render event markers (pill + amount label) along the curve
  - Render the empty-state inline pill (`Forecast lands in 24h`) when `events.length === 0` (Building state)
  - Skeleton mode flattened — no more `partial` mode with dashed-future segment
- Chart height bumped from 140 → 180 to make room for event amount labels above the curve.
- `ChartMode` simplified to `"filled" | "skeleton"`. Old `partial` mode (past solid + future dashed) is gone — Building uses `filled` with an empty events array, which renders a faded dashed line + the empty-state pill.

**Sample event sets (positive state):**

| Day from today | Date | Type | Amount | Source |
|---|---|---|---|---|
| 1 | Apr 22 | Bills | -$24 | National Grid |
| 3 | Apr 24 | Bills | -$40 | T-Mobile |
| 5 | Apr 26 | Payday | +$1,200 | Uber |
| 7 | Apr 28 | Bills | -$300 | Rent |

Negative state inverts the structure — rent ($300) hits **before** payday, dropping balance below zero between Apr 26 and Apr 28.

**Open questions to validate post-Build 2.1:**

- Does `Building` (the literal word) read as a state label or a placeholder? Cheapest test: 5-user comprehension check.
- Does the `Bills` neutral pill read as informational or as muted/inactive? If the latter, bump opacity to 24%.
- Visual density at 5+ events. Current data uses 4 events max. If a real Stretched user has 7 bills + 1 paycheck in a 14-day cycle, pills will overlap. Mitigation in Build 3: cluster small bills into a single `2 Bills $64` pill if events are within ±1 day of each other.

**Net file impact:** ~80 net lines added for event-based chart logic. Total file: ~2,720 lines.

---

## Build 3.1 — Bills + Smart Actions sections 🟡 ✅

**Why first within Build 3:** Bills and Smart Actions are the two most-decision-relevant sections. Bills answers *what's coming?*, Smart Actions answers *what should I do about it?* Together they carry the negative-state recovery flow end-to-end. The remaining five sections (Income, Recap, Spending, Activity, Improve) are informational rather than decisional and can ship as a follow-up batch.

**Goal:** Replace the Build 2 placeholders for Bills and Smart Actions with real components. Lock the section-ordering rule (D17b) by removing the negative-state pinned card from the hero region.

### Scope

| Item | Resolution |
|---|---|
| Bills section content | Next 7 days · merchant avatar + name + due-date label + signed amount + chevron. List rows are tappable buttons (placeholder route — no detail screen in Phase 1 prototype). |
| Bills data source | The chart's `events` array. Single source of truth — what shows on the chart equals what shows in the section. Eliminates the divergence we had between the chart events and the legacy `RECURRING_BILLS` mock. |
| Bills meta line | `Next 7 days · {n} bills · ${total}` — pre-totaled in the section header. |
| Bills empty states | Building: `We'll list bills here within 24 hours of linking.` Low: `Add a bill to start tracking.` |
| Smart Actions card (negative state) | **Designed from scratch** — no Figma reference available (PM confirmed Apr 28). Card body: `Recommended` chip · title `Move $50 from Chase Savings to cover Friday` · body explaining the math · 3-line breakdown (Transfer in / Closes shortfall / Buffer remaining) · 2-button group `Review move` / `See other options`. White card on Teal-100 section surface to distinguish recommendation from container. |
| Smart Actions empty states | Positive: `All clear · no actions needed`. Building: `Live within 24 hours`. Low: `Add details to unlock`. Each carries a one-line body that names what the section will surface. |
| Section ordering | Uniform across all states per ~~D17b~~ → D17c. Final order: `Hero → Smart Actions → Bills → Income → Recap → Spending → Activity → Improve`. Low trims to `Hero → Smart Actions → Bills → Activity → Improve`. (Build 3.1 originally landed with Bills before Smart Actions; the swap to position 1 happened in Build 3.2 — see D17c.) |
| Pinned Smart Action card (Build 2) | **Removed.** Smart Actions container always sits in the section system, never in the hero region. |

### Out of scope for Build 3.1
- Income, Recap, Spending, Activity, Improve sections — still labeled placeholders. Ship in Build 3.2.
- Real bill-detail route. Tap on a bill row is a no-op for now.
- Smart Action accept / reject behaviour. Buttons are static.
- Activity timeline content (deferred per O6).
- Recap content (deferred per O7).

### Build 3.1 actuals (post-completion)

| Item | Notes |
|---|---|
| New components | `SectionCard` (shared shell with optional accent surface), `BillsSection`, `SmartActionsCard`. Helper: `merchantColor()`, `formatDueDay()`, `MERCHANT_COLORS` map. |
| Components removed | `SmartActionPinned` (replaced by `SmartActionsCard` in section position). |
| Bills rows visible per state | Positive: 3 (`National Grid -$24` Tomorrow, `T-Mobile -$40` Apr 24, `Rent -$300` Apr 28). Negative: 3 (`T-Mobile -$40` Tomorrow, `National Grid -$24` Apr 24, `Rent -$300` Apr 26). Building / Low: header + empty meta line. |
| Smart Actions surface | Negative: Teal-100 outer with a Teal-300 bordered white inner card. Positive / Building / Low: white outer, no inner card. |
| Negative-state visibility | Build 3.1 originally landed Smart Actions at position 2 (after Bills), with Teal-100 surface as the visibility lift. Build 3.2 promoted Smart Actions to position 1 (directly under hero) — the Teal-100 surface stays as a redundant emphasis layer. |
| Section ordering implementation | `DashboardScreen` has a single `fullOrder` array used for every state except `low`, which trims mid-tail sections (Income / Recap / Spending) that have no Phase 1 content to render. |
| Data consistency | Bills section reads directly from `POSITIVE_CHART.events` / `NEGATIVE_CHART.events`. Adding or removing a chart event automatically updates the Bills list, the meta line, and the running total. |
| Linter | Zero new errors. The 4 IDE-only "cannot find module" warnings persist (pre-existing, runtime-resolved by Vite). |
| File size | ~3,000 lines (~280 added on top of Build 2.1). |

### Open questions to validate post-Build 3.1
- ~~Does the Teal-100 surface treatment on negative-state Smart Actions earn enough attention without the inline-pinned card?~~ Answered structurally in Build 3.2 — Smart Actions moved to section position 1, so the negative-state card now sits immediately below the hero. Teal-100 surface remains as redundant emphasis; whether it adds value on top of the position lift is a future testable question.
- Does the Cover card's 3-line math breakdown (Transfer in / Closes shortfall / Buffer remaining) read as transparency or as cognitive load? If the latter, fold the breakdown into a single "$50 covers your $45 gap with $5 buffer" sentence.
- Bills row tap target with no detail screen — does the chevron promise something the prototype can't deliver? Acceptable for Phase 1 stakeholder review; flag for production.

---

## Build 3.2 — Income / Recap / Spending sections 🟡 ✅

**Why this batch:** These three sections are the dashboard's "you've got the picture" layer — they tell the user what's coming in (Income), how the cycle has tracked (Recap), and where the money has gone (Spending). They round out the cash-flow story without committing to the more research-dependent Activity timeline or marketing-tinged Improve section.

### Scope

| Section | Phase 1 content (positive baseline) | Negative state | Building / Low |
|---|---|---|---|
| Income | Single row · Source label (`Uber`) · Next paycheck date (`Apr 26`) · Days-away (`in 4 days`) · Amount (`+$1,200` in Teal-900) · Tappable row → placeholder | Same row, paycheck farther out (`Apr 28 · in 6 days`) | Building: `Detecting income patterns`. Low: `Add a paycheck to forecast income`. |
| Recap | Collapsed by default · Header `This cycle · Started Apr 14 · Day 7 of cycle` · Tap-to-expand · Expanded body: Spent of expected income (with progress bar) + Bills paid on time (Teal if perfect, Yellow if missed) + vs last cycle delta (Teal if better, Red if worse). Phase 1 stat scope decided in Build 3.2 since O7 remained unresolved. | Same shape, different data — `$845 of $1,200`, `3 of 4 bills`, `+$90 more than last cycle` | Building / Low: `Recap unlocks within 24 hours` / `Recap unlocks once we detect a paycheck` |
| Spending | Header `Last 30 days · $1,247 total` · 3 category rows (Groceries / Dining / Transit) with colored icon avatar + progress bar + amount + percent · `See all spending →` link footer in Teal | Same shape, slightly higher absolute spend ($1,389 total) reflecting the negative-state user's stretch | Building: `Spending breakdown unlocks within 24 hours`. Low: `Add accounts to see spending breakdown`. |

### Build 3.2 actuals

| Item | Notes |
|---|---|
| New components | `IncomeSection`, `RecapSection`, `SpendingSection`, `RecapStatRow`. `SectionCard` extended with optional `onHeaderClick` and `trailing` slot to support the Recap accordion without adding a separate component. |
| New icons added to imports | `ArrowUpRight` (See-all link), `ShoppingCart` (Groceries), `Utensils` (Dining), `Car` (Transit), `Wallet` (Spending header). |
| Recap stat scope (resolves O7) | Three rows: (1) Spent / Expected income with progress bar; (2) Bills paid on time; (3) vs last cycle delta. Defensible Phase 1 minimum. PM can layer in saved-this-cycle, fees-avoided, etc. in a Phase 2 expansion. |
| Spending icon system | Colored circular avatars with white-foreground icons. Avoided introducing a separate icon-tinting pattern; reused the `MerchantAvatar` size + radius spec for visual consistency with Bills and Income rows. |
| Spending data source | Inline mock per state. Phase 2 will pull from a categorized transactions feed. |
| Cycle anchor | Cycle is paycheck-to-paycheck. Hardcoded `Started Apr 14 · Day 7` for prototype. Production logic infers from detected paycheck cadence. |
| Negative-state recap framing | When `vs last cycle` is worse, value renders red (`+$90 more`). When better, Teal-900 (`−$120 less`). Direction marker is a clean unicode minus / plus, not an emdash. |
| File size | ~3,500 lines (~500 added on top of Build 3.1). |
| Linter | Zero new errors. The 4 IDE-only "cannot find module" warnings persist (pre-existing, runtime-resolved by Vite). |

### Section-ordering swap (D17c)

Build 3.2 also moves Smart Actions to section position 1, above Bills, in every state. Closes a gap from Build 3.1 — the negative-state Smart Action card now sits immediately under the hero again, just inside the section system instead of floating between hero and sections. The "always same place" rule still holds; the place is now position 1 instead of position 2.

**Trade-off accepted:** Positive-state users see the empty `All clear · no actions needed` Smart Actions card before they see Bills. Reframed as a peak-end positive moment ("nothing urgent, you're good") rather than dead space. If user testing shows the empty card feels noisy, swap the empty state for a thin one-line affirmation (`All clear`) without an icon column.

### Open questions to validate post-Build 3.2

- Does the Recap accordion get expanded? If <10% of users expand it after 3 sessions, collapse the section into the hero sub-line and reclaim the scroll depth.
- Does `Last 30 days` on Spending make sense alongside `Day 7 of cycle` on Recap? Two different time anchors on the same screen is a known UX risk. If users get confused, normalize Spending to "this cycle" too.
- Spending category names — Groceries / Dining / Transit are intuitive but there's no Phase 1 categorization engine. Mock for now.

---

## Build 3.3 — Activity + Improve + low-state hero refinement 🟡 ✅

**Why this batch:** Activity and Improve are the dashboard's "what just happened" and "where to next" layers. They round out the section stack and close the V2 Phase 1 prototype. Bundled with a low-confidence hero refinement so the bottom-tier user gets a real anchor (their linked-account balance) instead of an em-dash.

### Scope

| Item | Resolution |
|---|---|
| Activity section | Header `Recent activity · Last {n} transactions` · 5 rows in positive/negative, 3 rows in low (transactions exist even without detection), empty in building. Each row: merchant avatar · name · relative time · signed amount (Teal-900 for credits, neutral for debits). Footer: `See all activity →` link in Teal. |
| Activity scope (resolves O6) | Last 5 transactions across linked accounts. Smart Action lifecycle feed is deferred to Phase 2 once Smart Actions earns engagement. |
| Improve section | Header `Improve your cash flow · 3 ways to get more from MoneyLion`. Three rows with icon-tinted avatars: Direct deposit (Teal), Add savings goal (Purple), Link other accounts (Yellow). Each row tappable, routes back to A2 Overview. |
| Low-confidence hero | Big number now shows the linked-account balance (`$500.00`) with header label `In your accounts` and right-side meta `across linked accounts`. Sub-line: `Add a bill or paycheck below to forecast safe to spend`. Tile 1 relabelled `Safe to spend · needs detection`. The point: even when we can't compute Safe to Spend, we surface what we *do* know — the user's bank balance — so the dashboard feels meaningful instead of broken. |
| Cleanup | `SectionPlaceholder` and `DASHBOARD_SECTIONS` removed. All seven sections are real components. `DashboardSectionKey` literal type replaces the keyof-typeof pattern. |

### Build 3.3 actuals

| Item | Notes |
|---|---|
| New components | `ActivitySection`, `ImproveSection`. Helpers: `fmtAmount()` (signed currency formatter with 2dp). Mock data: `ACTIVITY_DATA` (per state), `IMPROVE_ITEMS` (universal). |
| Hero changes | `HeroData` extended with optional `headerLabel` and `headerRight` for state-specific overrides. Existing states default to `Safe to spend` / `through Apr 28`. Low overrides both. |
| Sections removed | `SectionPlaceholder`, `DASHBOARD_SECTIONS`. The render path in `DashboardScreen` no longer falls through to a placeholder for any section. |
| File size | ~3,700 lines (~200 added on top of Build 3.2). |
| Linter | Zero new errors. The 4 IDE-only "cannot find module" warnings persist (pre-existing, runtime-resolved by Vite). |

### Polish layer — explicitly out of scope for the prototype

The original Build 3 spec listed a polish layer (hero state transition animation, section skeleton screens for Building state, toast undo pattern). Status:

- **Hero state transitions** — deferred. The state switcher snaps between states; production animation is a 200–300ms cross-fade with `prefers-reduced-motion` honored. Spec lives here; implementation lands with eng.
- **Section skeletons** — not built as a separate layer. Each section's empty state for Building/Low does the job (`Detecting income patterns`, `Recap unlocks within 24 hours`, etc.). If user testing shows the empty states feel passive, swap them for shimmering skeletons.
- **Toast undo** — Phase 1 has no destructive interactions to apply this to. Pattern lives in MLDS; noted for Phase 2 when bill removal lands.

### Open questions to validate post-Build 3.3

- **Low-state empty Activity vs. Activity-with-data.** If a brand-new user has zero transaction history (e.g., a Roar-only account with no spend yet), the prototype renders 3 mock rows. In production, gracefully degrade to the empty state.
- **Improve recommendations across states.** Currently universal. If a positive-state user with DD already set sees "Set up direct deposit", that's a content miss. Personalization gates these in production but the prototype shows all 3 to all states.
- **Activity row tap target promises a detail screen we don't render.** Acceptable for stakeholder review; flag for production.

---

## Phase 1 — Complete

The V2 Phase 1 prototype is now fully assembled and stakeholder-shareable. Recommended next steps:

1. **CPO + PM review** of the full flow (Splash → Dashboard, all 4 states, all 7 sections).
2. **5-user comprehension test** on the negative-state Smart Action card and the Recap accordion (the two highest-cognitive-load surfaces).
3. **Eng hand-off** for the polish layer (animations, skeleton states for production, real data wiring).
4. **Phase 2 scope-setting** — `Phase 2` table below captures deferred items.

---

## Build 3 — Original pre-split spec ✅ Superseded

The original Build 3 was a single combined batch (sections + state-aware reordering + polish). It was split into three sub-builds during execution as scope clarified:

- **Build 3.1** — Bills + Smart Actions sections (above)
- **Build 3.2** — Income / Recap / Spending sections + section-ordering swap to D17c (above)
- **Build 3.3** — Activity / Improve sections + low-state hero refinement + cleanup (above)

The original Build 3 polish layer (state transition animations, dedicated skeleton patterns, toast undo) is documented in the Build 3.3 "Polish layer — explicitly out of scope for the prototype" section. Implementation deferred to eng hand-off.

### Final risk to monitor in production

The seven-section scroll depth in negative state. The Smart Action card now sits at section position 1 directly below the hero — if it earns the user's attention, the rest of the sections may go unviewed during a crisis moment, which is fine and probably desired. But if the Cover card *doesn't* convert and the sections below also don't earn engagement, the dashboard fails its primary job. Worth measuring scroll depth + tap-rate-per-section in any production rollout.

---

## Phase 2 (placeholder, not in Phase 1 scope)

| Item | Why deferred |
|---|---|
| Manual bill add (typed entry) | Phase 1 commits to detection-only |
| Bill editing (rename, change amount, change due date) | Phase 1 read-only commitment |
| Bill removal / "this isn't recurring" | Phase 1 read-only commitment |
| Surplus / Grow Smart Actions | Needs its own design pass |
| Marketplace tie-ins on dashboard | Out of Cashflow surface for Phase 1 |
| Agentic bill negotiation | V1 ambition, not validated for Phase 1 |
| Demo / preview dashboard for unlinked users | Acquisition surface, not Phase 1 dashboard requirement |
| Notification on detection completion | Removed from Phase 1; revisit if return-rate research warrants |
| Cycle-anchored hero (Concept 2 from `dashboard-exploration.md`) | Strong differentiator, expensive build. Hold for Phase 2 if Phase 1 dashboard earns return engagement. |

---

## Outstanding documentation follow-ups

| Item | Owner | Notes |
|---|---|---|
| Append Phase B section to `flow.md` | Design | Phase B (dashboard composition) is currently spread across `dashboard-exploration.md` + Builds 2 / 2.1 / 3.x of this file. Consolidate into `flow.md` so the spec file matches Phase A's level of detail. ~30 minutes of writing. |
| Personalized Improve recommendations | PM / Design | Build 3.3 ships universal Improve content (DD / Savings goal / Link more) regardless of user state. Production gates: hide DD if already set, swap recs based on cash-flow ratio. Spec needed before eng can ship. |

---

## Changelog

| Date | Change |
|---|---|
| Apr 28 2026 | Initial build-phases doc. Phases A and B locked. Builds 1, 2, 3 sequenced. 18 decisions logged, 7 open items tracked. Ready to start Build 1. |
| Apr 28 2026 | Build 1 complete. Wired into Vite app (`cashflow-prototype/`). Figma alignment patch applied to A2 Overview (bank vs paycheck/bills icon differentiation, collapsible "More ways" card, brand avatars). Build 2 started. |
| Apr 28 2026 | Build 2 complete. Four dashboard hero states shipped (Positive, Negative, Building, Low confidence). Custom SVG balance chart with today + payday markers. Pinned Smart Action card for Negative state. All 7 sections render as labeled placeholders. State switcher extended. No new dependencies. Ready for stakeholder review before Build 3 commits to section content. |
| Apr 28 2026 | Build 2 revision: hero shell unified across all four states. Same dark surface, same chart structure, same 3 metric tiles in every state — only the data and accent color change. `BalanceChart` extended with `filled` / `partial` / `skeleton` modes and a dashed zero baseline for negative trajectories. `LowConfidenceCallout` card moved below the hero. Build 3 negative-state Smart Action card to follow [Figma 719:240895](https://www.figma.com/design/endEIkW1FOREycKnwfG6uX/PFM---Tickets--WIP-?node-id=719-240895&m=dev). |
| Apr 28 2026 | Build 2 marked ✅ complete after unified-hero refactor. D9 (stateful surface treatment) superseded by the unified-shell decision — see Build 2 revision section. Ready for stakeholder convergence checkpoint before Build 3 begins. |
| Apr 28 2026 | Build 2.1: chart redesigned to today-on-left forward-only with event pills. Daily budget chip dropped (revisit later). 6 design decisions locked, see Build 2.1 section. `BalanceChart` rewritten end-to-end with event-based data model. Chart height 140→180. Total file: ~2,720 lines. |
| Apr 28 2026 | Build 3.1: Bills + Smart Actions sections shipped. Bills consumes chart events as single source of truth (3 rows in positive/negative states, empty in building/low). Smart Actions card designed from scratch (no Figma — confirmed unavailable) with `Move $50 from Chase Savings to cover Friday` body, 3-line math breakdown, and 2-button group on a Teal-100 outer surface. State-aware empty states for the other 3 states. D17 (state-varying section order) superseded by D17b (uniform order, state drives content + visual emphasis). `SmartActionPinned` removed — Smart Actions container always sits in section position 2. Build 3 split into 3.1 (done), 3.2 (Income/Recap/Spending), 3.3 (Activity/Improve + polish). Total file: ~3,000 lines. |
| Apr 28 2026 | Build 3.2: Income / Recap / Spending sections shipped. Income = next-paycheck row with source, date, days-away, signed amount. Recap = collapsed accordion with Spent / Expected progress, Bills on time, vs last cycle delta — three-row scope locked, resolves O7. Spending = top 3 categories with colored icon avatars, percentage bars, and a See-all-spending link. `SectionCard` extended with `onHeaderClick` + `trailing` slot to support the Recap accordion. D17b (Smart Actions at position 2) superseded by D17c (Smart Actions pinned to position 1, immediately under hero, in every state). Total file: ~3,500 lines. Build 3.3 next: Activity + Improve + polish. |
| Apr 28 2026 | Build 3.3: Activity + Improve sections shipped. Activity = last 5 transactions with merchant avatars, signed amounts, relative time, and a See-all-activity link (3 rows in low state to anchor users with linked accounts). Resolves O6. Improve = 3 universal recommendation rows (DD, savings goal, link more) with icon-tinted avatars, all routing back to A2 Overview. `SectionPlaceholder` and `DASHBOARD_SECTIONS` removed — all 7 sections are real components. `HeroData` extended with optional `headerLabel` / `headerRight`; low-confidence hero now renders the linked-account balance (`$500.00 · In your accounts`) instead of an em-dash. Polish layer (state transition animations, production skeleton patterns) deferred to eng hand-off. **Phase 1 prototype complete.** Total file: ~3,700 lines. |
| Apr 28 2026 | Unlinked-user flow wired end-to-end. Splash CTA is now link-state aware: linked users see `Continue` → A2 Overview; unlinked users see `Link your bank` + trust microcopy → A1 Linking gate. After 1.5s in the loading state, A1 auto-routes to A2 in `Building your view` (production detection takes up to 24h, so the first post-link Overview is always Building). Demo state extended with a `linked: boolean` flag; State Switcher gets a separate `A0 Splash · Linked` and `A0 Splash · Unlinked` group so reviewers can demo both flows. Overrides the previous Phase A spec "CTA stays as Continue regardless of link state" — `flow.md` updated. |
| Apr 28 2026 | A2 Overview → Dashboard routing made deterministic per D19. `View my Cashflow` now lands on the dashboard hero state that matches the Overview detection state: High → Positive, Partial → Negative, Building → Building, Low → Low. Reviewers can walk every onboarding state to its dashboard counterpart end-to-end. Direct dashboard demos still available via the State Switcher. |
| Apr 28 2026 | Doc cleanup pass. D8 amended (Concept 3 "three shapes" framing superseded by D9b). D18 superseded by D18b (unified hero is the only dark surface across all 4 states; Yellow-100 negative-hero deprecation now reflected). O4 resolved (no surface-color shifts to animate after unified hero). Build 1 actuals A2 icon note corrected (paycheck/bills checkmark logic per detection status, not always indeterminate). Build 2 actuals tagged as historical and trimmed to non-superseded items. Build 2 revision implementation table updated to current state values (Building chart mode = filled with empty events; Low big-number = $500 with `In your accounts` label). Build 3.1 actuals + open questions amended to reflect D17c reorder. Stale pre-split Build 3 spec collapsed into a one-paragraph "superseded by 3.1/3.2/3.3" note. New Outstanding Documentation Follow-ups table flags Phase B append to `flow.md` and personalized Improve recs as remaining specs. |
| Apr 28 2026 | Negative-state refinements. (1) Hero now leads with shortfall framing per D10: big number is `$45 short`, header label flips to `Until payday`, sub-line carries the literal STS `-$45.00 Safe to Spend` for transparency. Resolves the prior implementation drift where the hero displayed `-$45.00` against D10's spec. (2) Smart Actions card became a 2-card horizontal carousel with scroll-snap + pagination dots: card 1 = `Get a $50 Instacash advance` (Instacash promoted as first option), card 2 = `Move $50 from Chase Savings`. Both Cover-pillar per D11. Each card shows source label, a 3-line math row, and matching CTA pair. Section meta updated to `2 ways to close your shortfall`. Total file: ~3,830 lines. |
| Apr 28 2026 | State Switcher cleanup. Stale "Build 2 · State Switcher" header replaced with "Cashflow V2 · Demo" + a one-line summary of the active state. Splash · Linked and Splash · Unlinked groups consolidated into a single A0 Splash group with a Linked / Unlinked segmented toggle (cuts 6 redundant rows to 3 + a toggle). All groups are now a single-open accordion — only the group containing the active state is expanded by default, others collapse to a row. Footer updated from Build 2/3 reference to "Phase 1 prototype · 4 hero states · all 7 sections live". Switcher height collapsed by ~60% in the default view. |
| Apr 29 2026 | MLDS canonical token migration. Added `MLDS-prototype-tokens.mdc` Cursor rule documenting the canonical CSS token sheet (colors_and_type.css) as the source of truth for prototype work, overriding select MLDS-4.0 values. Bundled Baton Turbo `.otf` foundry files into `cashflow-prototype/public/fonts/`, dropped the full token sheet into `cashflow-prototype/src/styles/mlds-tokens.css`, and imported it from `main.tsx`. `CashFlowV2Draft.canvas.tsx` `T` constant updated to canonical 3.0 hex values (Teal-800 accent, Yellow-800 warning, MLDS 3.0 100/300 surface and border ramps); `FONT_FAMILY` flipped from DM Sans substitute to Baton Turbo with the canonical fallback stack. Radii kept from prior tuning to avoid visual regression. Hot reload confirmed font is served (`/fonts/BatonTurbo-Medium.otf` → 200). |
| Apr 30 2026 | MLDS asset library bundled. Copied logos (`logomark-black/teal.svg`, `logo-mlone-black/white.svg`), bank marks (`Chase`, `BankOfAmerica`, `AmericanExpress`, `Mastercard`), and 17 icon SVGs into `cashflow-prototype/public/assets/`. Vite serves them at `/assets/...` (verified `/assets/banks/Chase_40.svg` → 200). `MLDS-prototype-tokens.mdc` rule extended with an Asset Library section documenting available files, React usage patterns, and fallback rules. |
| Apr 30 2026 | Real bank logos swapped into A2 Overview. `MerchantAvatar` extended with two new modes: (1) `src` for self-contained logos like `Chase_40.svg` / `BankOfAmerica_40.svg`, and (2) `iconSrc` + `color` for composing a glyph inside a tinted circle (used for RoarMoney = `logomark-black.svg` inside a teal-600 disc). Tinted-initial fallback preserved for any bank without a shipped MLDS asset. `BANK_ACCOUNTS` data shape extended with optional `src` / `iconSrc` fields. All other `MerchantAvatar` callers (Bills, Activity, Recap, Smart Action) untouched — they continue to render the initial fallback because no real logos exist for those merchants in MLDS yet. |
