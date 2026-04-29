# Cashflow V2 — Phase 1 Brief

> **Status:** Phase A locked, Phase B (dashboard composition) in ideation
> **Last updated:** April 2026
> **Predecessor:** `features/cash-flow/phases.md` (V1, frozen — do not modify)
> **Prototype target:** `prototypes/CashFlowV2Draft.canvas.tsx` (not yet built; awaits Phase B lock)

---

## Why V2 exists

V1 tried to validate the full ecosystem ambition on the dashboard surface itself: agentic Smart Actions, multi-product orchestration, deep activity timelines, marketplace tie-ins. The result was a Cashflow Hub that demoed well but asked too much of a first-time user before earning their attention.

V2 is a deliberate narrowing. The bet is that the **first 30 seconds** of the Cashflow experience should answer one question for the user — *"Does this product actually understand my money?"* — and nothing else. Everything that earns a user's return engagement (Smart Actions, recap, agentic suggestions, marketplace) is downstream of that first answer.

V2 is built on three Phase 1 commitments:

1. **No manual setup.** Detection-driven onboarding only. If we can't infer it from the bv-linked account, we don't ask the user to type it in.
2. **Onboarding becomes a transparency surface, not a setup chore.** The user lands on a single Overview screen that shows what we found. The act of "setup" becomes the act of "review."
3. **The dashboard goes deeper, not wider.** Fewer surfaces, more signal. The hero, primary metric, and section stack are open questions resolved in Phase B.

---

## Strategic anchor

Cashflow is the surface that delivers on the **See** pillar of MoneyLion's five jobs-to-be-done framework (See / Move / Cover / Plan / Grow). It is the most important pillar to nail because it is the precondition for every other pillar:

- A user who can't See their money clearly will not trust us to Move it.
- A user who doesn't trust our forecast won't act on a Cover suggestion (Instacash) when balance is short.
- A user who can't see surplus has no reason to engage with Grow.

If V2 lands, Cashflow becomes the daily-use anchor that makes RoarMoney the "primary financial home." If V2 doesn't land, MoneyLion stays a point-product in the user's mind (Instacash) regardless of how strong the rest of the ecosystem is.

---

## Target user

Same as MoneyLion's overall focus, with a sharpened lens:

| Segment | Cash Flow Ratio | Phase 1 Priority |
|---|---|---|
| Stretched | 1.0–1.5 | **Primary** — the user most stressed by volatility, most likely to value transparency |
| Stable | < 1.0 | **Secondary** — uses Cashflow for confidence and forecasting, less for crisis avoidance |
| Strained | > 1.5 | Out of Phase 1 active design scope, but the dashboard must not amplify their stress |

**Critical context:** 85% of MoneyLion's users have a bv-linked account. V2 design optimizes for this 85% as the default path. The 15% unlinked path is a gate, not a degraded experience.

---

## Phase 1 scope — what's in

### Phase A — Onboarding flow (locked)
- Entry logic from bottom navigation
- Linked / unlinked gate
- Single Overview / "See exactly where your money stands" screen
- Three detection pillars: Bank connection, Paycheck, Recurring bills
- Two detection states per pillar: Detected (expandable detail) / Not detected (empty)
- Two progressive enhancement actions: Link another account, Set up direct deposit
- Optional Confirm Recurring Bills side-trip
- Confidence tagging system (`high` / `partial` / `low`) carrying from Overview into Dashboard

### Phase B — Dashboard composition (in ideation)
Open questions to resolve in working session:
- Hero treatment: dark surface vs light? Chart-as-hero vs metric-as-hero?
- Primary metric: Safe to Spend, or something else (days-of-runway, end-of-month forecast, paycheck-cycle balance)?
- Section stack: what lives below the hero, in what order?
- Smart Actions surfacing: triggered, not exposed by default
- How confidence tagging applies to dashboard data (full clean, partial badge, low/empty)

### Phase 1 system additions
- **Confidence tag chip pattern.** Not in MLDS. Will need to be designed once and reused across Cashflow, Smart Actions, marketplace match scores, and any AI-derived insight surface. Phase 1 introduces it; broader system rollout is a separate effort.

---

## Phase 1 scope — what's out

| Out | Why |
|---|---|
| Manual income entry (typed) | Detection-only commitment for Phase 1 |
| Manual bill entry (typed) | Users add bills only by selecting from detected transactions (Screen A2.1 picker), never by typing |
| Bill editing (rename, change amount, change due date) | Phase 1 bill list is read-only; bill correction is Phase 2 |
| Bill deletion / "this isn't recurring" | Phase 2 — instrument mis-detected bills in Phase 1 research |
| Demo / preview dashboard for unlinked users | Adds two design surfaces and dilutes the linking call. Revisit as a Phase 2 acquisition surface |
| Activity timeline | V1 feature; deferred until dashboard composition (Phase B) confirms it earns its space |
| Multi-product orchestration on dashboard | Smart Actions are the only cross-product surface in Phase 1 |
| Marketplace tie-ins | Out of Cashflow surface for Phase 1 |
| Agentic bill negotiation, savings optimization | V1 ambitions; deferred |
| Budget categories, budget rings | Not in Phase 1 dashboard ideation set |
| Subscription manager | Belongs to Move pillar, separate workstream |

---

## Detection states (Phase A spine)

Every screen in Phase A is composed against this state model. Phase B inherits it.

| State | Trigger | Overview pillar treatment | Dashboard treatment |
|---|---|---|---|
| **High confidence** | All 3 pillars detected | All ✓, expandable detail rows | Clean number, no badge, populated sections |
| **Partial** | Bank linked, paycheck OR bills missing | Mixed ✓ and ⊝ | Number + `Partial estimated` chip, sparse sections |
| **Low / no detection** | Bank linked, neither paycheck nor bills detected | Bank ✓, both others ⊝ | TBD in Phase B — likely identical to Partial visually with stronger nudge |
| **Unlinked** | No bv-linked account | Gate screen replaces Overview | No dashboard access |

---

## Success criteria

Phase 1 is successful if:

1. **Time to first dashboard view** is under 30 seconds for a bv-linked returning user
2. **Direct deposit setup rate** lifts among users who see the Overview's "Recommended" prompt
3. **Confidence tag is read as transparency, not as broken-product**, validated in user research before any A/B
4. **Cashflow tab return rate** improves week-over-week (proxy for "primary financial home" outcome)

Failure modes worth instrumenting from day one:
- Users dismiss Overview without engaging the checklist or recommendations (signals the screen is friction, not value)
- Users with `Partial estimated` badge engage less than users with no badge (signals the badge breaks trust)
- Bill confirmation completion is below 20% of users who see it (signals the side-trip isn't worth its design cost)

---

## Voice + tone commitments

Reaffirmed from `project-instructions.mdc`:
- First-person framing, present tense
- Empowering, not soothing
- No emdashes
- Confidence claims must be earnable. Never overstate what we know about the user's money.

V2-specific:
- The Overview screen's job is to **show our work**, not to brag. Copy describes what was found, not what we built.
- Confidence states do not apologize. `Partial estimated` is a transparency signal, not a disclaimer.

---

## Working files

| File | Purpose | Status |
|---|---|---|
| `phases.md` (this file) | Phase 1 strategic brief — scope, success criteria, target user | ✅ Phase A and Phase B locked |
| `flow.md` | Screen-by-screen breakdown — copy, MLDS components, edge cases | ⚠️ Phase A locked; Phase B section appended after Build 2 sign-off |
| `dashboard-exploration.md` | Phase B concept exploration — three concepts, recommendation, locked direction | ✅ Concept 3 + Concept 1 hero selected |
| `build-phases.md` | Prototype build sequence — decision log, open items, Build 1/2/3 scope and tracking | ✅ Drafted, ready to start Build 1 |

---

## Changelog

| Date | Change |
|---|---|
| Apr 2026 | Initial Phase 1 brief. Phase A locked, Phase B in ideation queue. |
| Apr 2026 | Sharpened "what's out": bill list is read-only; bill add is via transaction picker only (no typed entry); bill edit/delete deferred to Phase 2. |
| Apr 2026 | Phase B locked. Concept 3 (state-adaptive hero) + Concept 1's positive-STS hero. 18 design decisions logged in `build-phases.md`. Build sequence defined (3 builds). |
