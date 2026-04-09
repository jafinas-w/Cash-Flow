# Cash Flow — Build Phases

> **Purpose:** Working reference for design and build order. Update status markers as each phase completes.
> **Last updated:** April 9, 2026
> **Owner:** Jaf Inas / PFM Team

---

## How to read this file

**Status markers:** ✅ Complete · ⚠️ Partial · ⬜ Not started · 🔄 In progress

**Complexity:** 🟢 Low · 🟡 Medium · 🔴 High

**Build order logic:** Phases are sequenced by three rules — (1) foundation before features, (2) screens the user sees first get built first, (3) complex new screens come after simpler ones they depend on. Phases 2 and 3 can run in the same session since they touch the same component.

---

## Decision Log (Locked)

All decisions below are confirmed. No further alignment needed before building.

| Ref | Decision |
|---|---|
| D1 | Soft BV-link prompt: never suppress entirely. Accessible via settings path after dismissal. |
| D2 | When user transitions manual → BV-linked: manual entries not matched by BV detection persist as user-confirmed obligations until explicitly removed. |
| D3 | Manual-only user accounts page: replace total balance card with "Let's Get You Started" prompt with BV-link CTA. |
| D4 | RoarMoney ≠ BV-linked unless user set up Direct Deposit via Plaid during onboarding. RoarMoney-only = partial data state. |
| D5 | Multi-BV link: assume no duplication. No deduplication logic needed for v1. |
| D6 | Bill review gate is mandatory after successful BV-link before STS is shown. |
| D7 | If linked account history < 2 weeks: show inline option to manually supplement within the bill review gate. |
| D8 | Joint accounts: Plaid flags reliably. Trigger interstitial on detection. User chooses full balance or custom share %. Persistent disclosure in CF view. |
| D9 | STS formula and label differ between linked and manual users. (Legal review paused — not a blocker.) |
| D10 | Pending transactions: count as committed obligations in STS. Surface as their own line in upcoming payments. |
| D11 | Instacash active advance: listed as committed obligation under upcoming payments. Dummy amount for now. |
| D12 | Low transaction history state: show "Still learning your patterns" message with reduced confidence tier. |
| D13 | "Reconnect needed" is a distinct UI state from "Stale data." Stale = degraded accuracy (wait). Broken = unreliable number (act). |
| D14 | Credit card accounts: excluded from total balance calculation. |
| D15 | Savings accounts: included in total balance (net worth context) but excluded from STS calculation. |
| D16 | Missing transactions (balance refreshed, transactions lagging): per-account freshness timestamp + "Some recent activity may not be reflected yet" messaging. |

---

## Open Items (Pending External Input)

| Ref | Item | Owner | Needed for |
|---|---|---|---|
| O1 | Minimum transaction history threshold for confident recurring detection (likely 60–90 days). | Engineering | Phase 5 |
| O2 | How scheduled RoarMoney autopays appear in the transaction feed — do they surface as a distinct event type? | Engineering | Phase 3 |
| O3 | Does Instacash repayment appear as a scheduled deduction in the paycheck feed, or as a transaction post-deduction? | Instacash team | Phase 3 |
| O4 | Legal review of STS label distinction (linked: "Safe to Spend" vs manual: "Expected after bills"). | Legal/Compliance | Phase 2 |
| O5 | Notification channel rules and consent constraints for cash flow alerts (push, SMS, email). | Legal/Compliance | Phase 7 |
| O6 | North star metrics sign-off: overdraft reduction, trust score, return visits near payday. Anti-metrics: wrong-number contacts, opt-outs. | PM + Analytics | Phase 8 |

---

## Phase 0 — Already Built ✅

**Current state of the prototype (`cashflow-prototype/src/App.tsx`)**

| Screen | Status | Notes |
|---|---|---|
| Accounts page | ⚠️ Partial | Basic layout built. User state logic not correct yet — fixed in Phase 1. |
| Feature intro / Splash | ✅ | Two-path CTAs (link bank / manual). Functional. |
| Link bank: institution picker | ✅ | Search + list. Functional. |
| Link bank: connecting + success | ✅ | Auto-advances after 2.5s. |
| Manual: paycheck entry | ✅ | Amount, frequency, date chips. Functional. |
| Manual: bills checklist | ✅ | Toggle, edit amount, add custom bill. Functional. |
| Cash Flow: main screen (linked) | ⚠️ Partial | Hero, SpendBar, breakdown, obligations list. Missing several states — fixed in Phase 3. |
| Cash Flow: main screen (manual) | ⚠️ Partial | Not yet differentiated from linked variant — fixed in Phase 2. |

---

## Phase 1 — Accounts Page: User State Logic 🟢 ✅

**Why first:** This is the entry point of the entire feature. Every stakeholder review starts here. It must show the right experience per user type before anything else is built on top of it. Lowest complexity — it is conditional rendering, not new screens.

**Goal:** Accounts page renders the correct experience for each user segment. No wrong states shown.

**Estimated effort:** 1 session

### Screens affected
- Accounts page
- Cash Flow screen (BV-link prompt added, see note below)

### User state matrix implemented

| User state | Total balance card | CF widget |
|---|---|---|
| No accounts, no RoarMoney, no manual | Hidden entirely | Teaser (blurred $???, "Get started" CTA) |
| Manual setup only (no linked accounts) | "Let's Get You Started" prompt card with BV-link CTA (D3) | Manual estimate widget, "Manual estimate" badge |
| RoarMoney only, no Plaid DD | Shows RoarMoney balance only | Partial confidence — RoarMoney data only (D4) |
| RoarMoney with Plaid DD set up | Full balance (RoarMoney + DD source) | High confidence |
| External BV-linked (with or without RoarMoney) | Sum of all linked checking + savings, no credit cards (D14, D15) | High confidence |

### What was built
- Removed hardcoded `$4,211` total balance — state-driven via `totalBalanceFor()`
- "Let's Get You Started" card replaces balance card for manual users (D3)
- RoarMoney-only state with partial confidence widget (D4)
- Credit card accounts excluded from balance sum (D14)
- Savings visible in total balance but not in STS (D15)
- **D1 (early): Soft BV-link prompt added to CF screen for `manual-only` and `roarmoney-only` states.** Dismissible. On dismiss, shows footnote directing user to Settings › Cash Flow › Improve your accuracy. CTA navigates to link bank flow. Pulled forward from Phase 6 since the CF screen was already open.

### Dependencies
- None. All decisions locked. No open items blocking.

### Success criteria ✅
- Every user segment shows the correct balance card variant
- CF widget always matches the user's actual data state
- No balance figure shown when no financial data exists

---

## Phase 2 — Cash Flow Screen: Manual Users 🟢 ⬜

**Why second:** The manual CF screen is self-contained — it modifies an existing component with no dependency on any new screens. It has no external blockers (O4 is legal copy review, not a build blocker). Building it now establishes the formula and label distinction that all future screens reference. Runs in the same session as Phase 3.

**Goal:** Manual user CF screen is clearly distinct from the linked variant — different formula, different label, persistent upgrade prompt.

**Estimated effort:** 1 session (can combine with Phase 3)

### Changes to existing CF screen (manual variant)

**Label and formula changes (D9)**
- STS label: "Safe to Spend" → "Expected after bills"
- Remove "As of [time]" timestamp — replace with "Based on your [date] update"
- Confidence badge: "Manual estimate" (replaces "Low confidence" — different framing entirely)
- "Why this number" breakdown shows paycheck-based rows:
  - Next paycheck: $[amount entered]
  - Bills due before [date]: -$[total entered]
  - Expected after bills: $[result]

**SpendBar for manual users**
- Cannot show balance-based breakdown (no balance data exists)
- Replace SpendBar with a paycheck bar:
  - Full bar width = paycheck amount
  - Red fill = committed bills total
  - Green remainder = expected after bills

**Persistent BV-link prompt (D1)**
- ~~Position: below hero card, above "Why this number"~~ ✅ Built in Phase 1 (pulled forward)
- ~~Dismissible via X button~~ ✅ Built in Phase 1
- ~~After dismiss: accessible via Settings > Cash Flow > Improve your accuracy (Phase 7)~~ ✅ Footnote built in Phase 1
- ~~Copy direction: "Your number is based on what you entered. Link your bank for a real-time view."~~ ✅ Built in Phase 1
- ~~CTA: "Link my bank account"~~ ✅ Built in Phase 1
- Note: Also applies to `roarmoney-only` state (different copy). Both states handled.
- Does not resurface automatically in the same session after dismissal ✅

### Dependencies
- D9 locked
- O4 (legal label review) — build proceeds, copy subject to change later

### Success criteria
- Manual and linked CF screens are visually and structurally distinct
- User cannot mistake a manual estimate for a real-time balance-based number
- BV-link prompt is present and dismissible ✅

---

## Phase 3 — Cash Flow Screen: Linked Users 🟡 ⬜

**Why third:** Builds on the same component as Phase 2 (same session), adding more states and data model depth. Some items use dummy data pending O2/O3, which does not block the build — placeholders are valid for prototype review.

**Goal:** Linked user CF screen reflects the full, correct data model with all edge states covered.

**Estimated effort:** 1 session (combine with Phase 2)

### Changes to existing CF screen (linked variant)

**Obligations list additions**
- Pending transactions: listed as their own labeled section within upcoming payments (D10)
  - Label: "[Merchant name] — Pending"
  - Visually distinct from confirmed obligations (lighter treatment)
- Instacash active advance: listed as committed obligation (D11)
  - Label: "Instacash repayment — [payday date]"
  - Dummy amount until O3 is resolved

**New states to add**

| State | Complexity | Trigger | UI treatment |
|---|---|---|---|
| Low history / "Still learning" | 🟢 | Account < O1 threshold (use 14 days as placeholder) | New confidence tier: "Still learning". Banner: "We are still building your pattern. Your number gets more accurate over the next few weeks." (D12) |
| Reconnect needed | 🟡 | Plaid token expired or MFA required | Distinct from stale. Red persistent banner: "Your [Bank] connection needs attention — your number may be unreliable." Primary CTA: "Reconnect now". STS shown as last-known value with "Unreliable" badge replacing confidence badge. (D13) |
| Missing recent transactions | 🟢 | Balance refreshed, transactions lagging | Per-account note: "Last activity: [time]". Banner: "Some recent spending may not be reflected yet." (D16) |

**SpendBar and formula**
- Savings balance: visible in total balance breakdown but not in SpendBar or STS formula (D15)
- Pending transactions: included in the committed slice of SpendBar (D10)

### Dependencies
- O2 (RoarMoney autopay feed format) — dummy data used until resolved
- O3 (IC repayment timing) — dummy amount used until resolved
- D10–D16 all locked

### Success criteria
- All three new states are reachable and visually distinct
- Reconnect needed and stale data are clearly different interactions
- Pending transactions and IC advance appear in obligations list
- Savings excluded from STS, visible in balance breakdown

---

## Phase 4 — Onboarding Flow: New Screens 🟡 ⬜

**Why fourth:** The splash → link bank and splash → manual paths already work. This phase only adds two new screens that slot into the existing flow. Comes after CF screens are complete so the screens that these paths lead to are already polished.

**Goal:** All onboarding paths are complete and each terminates in the correct first-time Cash Flow experience.

**Estimated effort:** 1 session

### Screens to add

| Screen | Complexity | Notes |
|---|---|---|
| Joint account interstitial | 🟡 | Triggers between "Connecting…" and "Connected!" if Plaid flags joint account (D8) |
| RoarMoney-only path | 🟢 | User has RoarMoney but skipped Plaid DD — shows partial state, prompts to link for full accuracy |

### Joint account interstitial detail (D8)
- Triggered between "Connecting…" and "Connected!" screens if Plaid flags joint account
- Copy: "This looks like a joint account. How should we count this balance?"
- Option 1: "Use full balance" (default)
- Option 2: "Use my share only" — percentage input appears, default 50%
- After confirm: connection continues, joint flag stored, persistent "Joint account" badge added to that account row in CF view

### RoarMoney-only path
- User reaches accounts page with RoarMoney balance but no external BV-link
- CF widget shows partial confidence state with soft prompt to link external account
- Widget copy: "You are set up with RoarMoney. Link your main spending account for a clearer picture."

### Dependencies
- Phases 2 and 3 must be complete (paths lead to CF screens)
- D8 locked

### Success criteria
- Joint account interstitial triggers correctly and stores user's choice
- RoarMoney-only users see partial state, not teaser and not full confidence
- Both new screens advance correctly into Cash Flow

---

## Phase 5 — Bill Review Gate (Post-Linking) 🟡 ⬜

**Why fifth:** First major new screen. Inserts between the existing "Connected!" screen and Cash Flow. Depends on the CF screen (Phase 3) being complete since it leads directly to it. Uses O1 as a placeholder threshold until Engineering responds.

**Goal:** After every successful BV-link, users review and confirm detected recurring items before their STS number is shown for the first time.

**Estimated effort:** 1–2 sessions

### New screen: Bill Review Gate
- Inserts between "Connected!" and Cash Flow in the link bank path
- Header: "We found [N] recurring payments"
- Subheader: "Review and confirm before we calculate your number"

### Each detected item row
- Icon + label + detected amount + detected frequency chip
- Per-row actions: Confirm (✓ tap), Edit amount/label (inline, no modal), Remove (×)
- All items start unconfirmed — user must actively confirm or they are treated as suggested

### Footer actions
- "+ Add a bill we missed" — opens same inline form as manual bills screen
- "Looks right, show my Cash Flow" — only active when at least one item is confirmed

### Low-history state (D7)
- If account history < threshold (using 14 days as placeholder until O1 confirmed):
  - Inline banner above the list: "We do not have enough history yet to find all your bills. Add any we missed below."
  - Manual supplement option is available by default — same "+ Add a bill" affordance
  - Items added manually are tagged "You added this" for visual distinction

### Dependencies
- Phase 3 (CF linked screen) must be complete — this screen leads there
- O1 (history threshold) — using placeholder value, update when Engineering confirms
- D6, D7 locked

### Success criteria
- STS is never shown to a newly linked user without passing through this screen
- Users can confirm, edit, remove, and add items
- Low-history state clearly labels manual additions vs detected items
- "Looks right" CTA requires at least one confirmed item

---

## Phase 6 — Manual → BV-Link Reconciliation 🔴 ⬜

**Why sixth:** The most complex and novel screen in the project. No precedent in the current prototype. Depends on Phase 5 (bill review gate) being complete since reconciliation follows it in the flow. Requires the most careful UX thinking before building.

**Goal:** When a user who already has manual data links a bank account, their data is cleanly reconciled — not silently overwritten.

**Estimated effort:** 2 sessions

### When it triggers
- User has existing manual data (paycheck + bills entered)
- User goes through the splash → link bank → bill review gate flow
- After bill review gate confirms, reconciliation screen appears before CF

### New screen: Reconciliation
- Header: "Let's check what changed"
- Subheader: "We compared what you entered with what we found. Review any differences."

### Three row types

| Row type | Appearance | Action |
|---|---|---|
| Conflict | "You entered: $850 · We found: $900" | Keep mine / Use detected |
| Unmatched manual entry (D2) | "We did not find this — keep it as an obligation?" | Keep / Remove |
| New BV-detected (not in manual) | "We found this — add it?" | Add / Skip |

- CTA: "Confirm and continue"
- All rows must be resolved before CTA is active

### Post-reconciliation
- Manual data archived — accessible via Settings > Cash Flow > Manual entries (Phase 7)
- Unmatched confirmed manual entries persist as obligations (D2)
- BV data becomes primary source of truth

### Dependencies
- Phase 5 must be complete (reconciliation follows bill review gate in the flow)
- D2 locked

### Success criteria
- No conflict is silently resolved without user input
- Every row has a clear binary choice — no ambiguous states
- User can access archived manual data after the fact

---

## Phase 7 — Cross-Cutting States and Settings 🟡 ⬜

**Why seventh:** Depends on all screens being complete, since it stitches them together and provides the settings surface that multiple screens reference.

**Goal:** States and flows that span multiple screens are handled consistently. Dismissed prompts have a recovery path.

**Estimated effort:** 1–2 sessions

### Settings surface: Cash Flow settings
- Entry: Settings > Cash Flow
- Items:
  - "Improve your accuracy" — BV-link prompt for manual users who have dismissed it (D1)
  - "Review your bills" — shortcut to bill review for linked users who want to audit
  - "Manual entries" — archive of pre-link manual data for users who have transitioned (D2)

### Per-account freshness display
- Each linked account in the CF balance breakdown shows "Last updated [time]"
- If any account > freshness threshold: per-account stale indicator appears inline

### Joint account disclosure (D8)
- Persistent "Joint account" badge on affected account row
- Note in "Why this number" section if joint balance is included in STS

### Notification placeholder states (pending O5)
- "Low balance alert" push notification UI treatment
- "Upcoming bill in 2 days" push notification UI treatment
- Placeholder only — no live logic until O5 resolved

### Dependencies
- All previous phases must be complete
- O5 (notification legal sign-off) — placeholder states built now, finalized after O5

---

## Phase 8 — Polish, Edge Cases, and Iteration 🟡 ⬜

**Why last:** Everything must be stable before polish is applied. Edge cases are found by walking through a complete, working prototype.

**Goal:** All edge cases covered, interactions feel native, ready for stakeholder review and user testing.

**Estimated effort:** 2–3 sessions

### Edge cases to cover

| Case | Screen | Treatment |
|---|---|---|
| Zero balance + committed bills | CF linked | At-risk state, Instacash nudge triggered |
| Negative balance (overdraft) | CF linked | STS shows negative, urgent red state, IC nudge prominent |
| No bills detected after linking | Bill review gate | Empty state with manual add prompt, cannot proceed without adding at least one item |
| All bills removed by user | CF linked | Zero committed obligations, STS = balance minus variable minus buffer |
| Paycheck not yet detected | CF linked | No income anchor — prompt to confirm paycheck date manually |
| Multiple paychecks (two jobs) | CF linked | Multiple income entries, STS uses combined cadence |
| First session after reconciliation | CF linked | Brief transition moment: "Your Cash Flow is now based on your real accounts" |

### Interaction polish
- Screen transitions: slide-in for forward navigation, slide-out for back
- SpendBar: animate fill from left on first load (300ms ease)
- STS number: count-up on first appearance (200ms)
- Skeleton screens on all data-loading states

### Accessibility pass
- WCAG AA contrast check on all semantic color combinations
- Touch targets audit — 44px minimum on every interactive element
- Screen reader labels on all icon-only buttons and status indicators

### Metrics instrumentation (pending O6)
- Instrument: first-time STS view, bill review completion rate, BV-link conversion from manual prompt, reconnect completion rate
- Anti-metrics: "number is wrong" flags, manual override frequency, prompt dismissal rate

---

## Build Order Summary

```
Phase 1          Phase 2 + 3 (same session)       Phase 4
─────────────    ─────────────────────────────    ──────────────────
Accounts page    CF screen: manual variant         Onboarding:
user state       CF screen: linked variant +       joint account +
logic            all edge states                   RoarMoney path

     All three above must be done before ↓

Phase 5          Phase 6                          Phase 7
─────────────    ────────────────────────────     ──────────────────
Bill review      Manual → BV-link                 Cross-cutting
gate             reconciliation                   states + settings
(post-linking)   (most complex — new UX)

                         ↓

                      Phase 8
                 ────────────────────────────
                 Polish, edge cases,
                 accessibility, metrics

```

**Phases 2 and 3** are built together — same component, same session.
**Phase 6** is intentionally last among new screens — highest complexity, novel UX pattern, depends on Phase 5.
**No phase should start until the one before it is marked ✅.**

---

*Last updated: April 2026*
*Source: Design sessions with [Jaf Inas / PFM Team] — Cash Flow v1*
