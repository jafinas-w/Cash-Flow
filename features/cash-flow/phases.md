# Cash Flow — Build Phases

> **Purpose:** Working reference for design and build order. Update status markers as each phase completes.
> **Last updated:** April 16, 2026 (Phases 1–8 complete + Confidence/Paycheck patch)
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
| D17 | Post-BV manual obligations are limited to fixed recurring commitments (rent, loans, subscriptions, insurance). Linked data remains the primary source; manual entries are user-confirmed exceptions. |
| D18 | Live STS is deferred to a mature phase and only applies to BV-linked users with high confidence. v1 stays snapshot-based with freshness/confidence messaging. |

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

## Phase 2 — Cash Flow Screen: Manual Users 🟢 ✅

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

### What was built
- Label: "SAFE TO SPEND" → "EXPECTED AFTER BILLS" for manual profile ✅
- Timestamp: "As of [time]" → "Based on your [date] update" ✅
- Confidence badge: "Low confidence" → "Manual estimate" (yellow, not red) ✅
- `PaycheckBar` component: replaces `SpendBar` for manual — red = bills, teal = expected remaining ✅
- Manual CF data model: `safeToSpend` is now `balance − committedTotal`, `estimatedVariable = 0` (clean formula) ✅
- "How we got this number" (renamed from "Why this number"): paycheck-based rows for manual — Next paycheck, Bills due, Expected after bills ✅
- "Bills you entered" section replaces "Upcoming committed payments" for manual, with "Edit my bills ›" footer CTA ✅
- Recommended next step: distinct copy for manual short / tight / ahead states ✅
- Instacash nudge: hidden for manual profile — not relevant without bank link ✅

### Success criteria ✅
- Manual and linked CF screens are visually and structurally distinct ✅
- User cannot mistake a manual estimate for a real-time balance-based number ✅
- BV-link prompt is present and dismissible ✅

---

## Phase 3 — Cash Flow Screen: Linked Users 🟡 ✅

**Why third:** Builds on the same component as Phase 2 (same session), adding more states and data model depth. Some items use dummy data pending O2/O3, which does not block the build — placeholders are valid for prototype review.

**Goal:** Linked user CF screen reflects the full, correct data model with all edge states covered.

**Estimated effort:** 1 session (combine with Phase 2)

### What was built

**Obligations list additions**
- Instacash active advance: listed as committed obligation row in linked `tight` and `short` model data (D11) ✅
  - Label: "Instacash repayment — [payday date]", dummy $55 amount (pending O3)
- Pending transactions: listed as a visually distinct sub-section below confirmed obligations (D10) ✅
  - Dashed border + 70% opacity + "Authorised [date] · Not yet cleared" subtext
  - Divider row with "PENDING" label separates sections

**New states added (all reachable via "Linked state overlay" controls)**

| State | Trigger | UI treatment | Status |
|---|---|---|---|
| Still learning (D12) | Overlay: "Still learning" | Confidence badge → "Still learning" (yellow). Yellow banner: "We are still building your pattern..." | ✅ |
| Reconnect needed (D13) | Overlay: "Reconnect needed" | Confidence badge → "Unreliable" (red). Hero label → "LAST KNOWN VALUE". STS number dimmed (60% opacity). Red top-of-screen persistent card with "Reconnect Chase →" CTA. Instacash nudge hidden. | ✅ |
| Missing recent transactions (D16) | Overlay: "Missing transactions" | Yellow banner in hero: "Some recent spending may not be reflected yet" + last sync timestamp | ✅ |

**Balance breakdown (D15)**
- "Current balance" row renamed to "Current balance (checking)" — savings clearly excluded ✅
- Savings shown as informational teal card below breakdown: "$1,035 — not counted in Safe to Spend" ✅

**Data model**
- `CFModel` extended with `savings?: number`, `pendingTx?: CFObligation[]` ✅
- `LinkedOverlay` type added to App state ✅
- Controls panel: new "Linked state overlay" section with 4 chips ✅
- Reset button now also clears `linkedOverlay` ✅

### Dependencies
- O2 (RoarMoney autopay feed format) — dummy data used until resolved ✅
- O3 (IC repayment timing) — dummy $55 amount until resolved ✅
- D10–D16 all locked ✅

### Success criteria ✅
- All three new states are reachable and visually distinct ✅
- Reconnect needed and stale data are clearly different interactions ✅
- Pending transactions and IC advance appear in obligations list ✅
- Savings excluded from STS, visible in balance breakdown ✅

---

## Phase 4 — Onboarding Flow: New Screens 🟡 ✅

**Why fourth:** The splash → link bank and splash → manual paths already work. This phase only adds two new screens that slot into the existing flow. Comes after CF screens are complete so the screens that these paths lead to are already polished.

**Goal:** All onboarding paths are complete and each terminates in the correct first-time Cash Flow experience.

**Estimated effort:** 1 session

### What was built

**Joint account interstitial (D8)**
- New screen: `"joint-account"` — slots between "Connecting…" and Cash Flow ✅
- Triggered in the prototype via "Simulate joint account" toggle in the controls panel (Onboarding flags section) ✅
- Two option cards with radio selection:
  - "Use full balance" (default) ✅
  - "Use my share only" — reveals a +/− percentage stepper (default 50%, steps of 5%) with live dollar preview ✅
- Disclosure note: directs user to Settings › Cash Flow › Account settings to change later ✅
- On confirm: `isJointAccount` and `jointShare` stored in App state, routes to Cash Flow ✅
- Persistent "Joint account" badge on "Current balance (checking)" row in CF breakdown, showing full balance vs share % ✅
- Reset button clears joint state ✅

**RoarMoney-only path**
- Widget badge renamed from "Partial confidence" → "Partial view" (clearer framing) ✅
- Soft prompt card added inside widget: "You are set up with RoarMoney. Link your main spending account for a clearer picture." ✅
- Widget copy and badge are already wired to `roarmoney-only` account state from Phase 1 ✅

### Dependencies
- Phases 2 and 3 complete ✅
- D8 locked ✅

### Success criteria ✅
- Joint account interstitial triggers correctly (via simulate toggle) and stores user's choice ✅
- % stepper works with live dollar preview ✅
- Joint badge appears in CF breakdown, persists until reset ✅
- RoarMoney-only users see partial state with soft link prompt ✅

---

## Phase 5 — Bill Review Gate (Post-Linking) 🟡 ✅

**Why fifth:** First major new screen. Inserts between the existing "Connected!" screen and Cash Flow. Depends on the CF screen (Phase 3) being complete since it leads directly to it. Uses O1 as a placeholder threshold until Engineering responds.

**Goal:** After every successful BV-link, users review and confirm detected recurring items before their STS number is shown for the first time.

**Estimated effort:** 1–2 sessions

### What was built

**New screen: `"bill-review"`**
- Inserts in flow: Connecting → [Joint account if simulated] → Bill review → Cash Flow ✅
- Header: "We found 5 recurring payments" (5 seed items from INITIAL_DETECTED) ✅
- Subheader: "Review and confirm before we calculate your Cash Flow number" ✅

**Item rows — three interaction states:**
- **Unconfirmed (default):** label + amount + frequency chip + "✓ Confirm this bill" full-width CTA + Edit text link + × remove button ✅
- **Confirmed:** teal border + teal accent background + ✓ filled circle, Edit + × still accessible ✅
- **Editing (inline, no modal):** label text input + $ amount input + Save / Cancel buttons; saving auto-confirms the item ✅
- Remove (×): removes item from list entirely ✅

**Footer**
- "+ Add a bill we missed" — opens inline add form (name + amount), adds as confirmed + "You added this" badge ✅
- Cancel/close on add form ✅

**Progress bar + count:** live "X of Y confirmed" with animated teal fill ✅

**CTA gate (D6):** "Looks right, show my Cash Flow →" button — disabled/greyed until ≥1 item confirmed; "Confirm at least one bill to continue" helper text shown when blocked ✅

**Low-history state (D7)**
- Controlled via "Simulate low history" toggle in Onboarding flags controls ✅
- Yellow banner above list: "We do not have enough history yet — account newer than 14 days" ✅
- All manually added items tagged "You added this" (regardless of low-history flag) ✅

**Routing**
- `handleConnected` now routes to `bill-review` (not cashflow directly) ✅
- `handleJointConfirm` now routes to `bill-review` (not cashflow directly) ✅
- Reset clears `simulateLowHistory` ✅

### Dependencies
- Phase 3 complete ✅
- O1 (history threshold) — using 14 days as placeholder ✅
- D6, D7 locked ✅

### Success criteria ✅
- STS is never shown to a newly linked user without passing through this screen ✅
- Users can confirm, edit, remove, and add items ✅
- Low-history state clearly labels manual additions vs detected items ✅
- "Looks right" CTA requires at least one confirmed item ✅

---

## Phase 5A — Confidence + Paycheck Validation Patch 🟡 ✅

**Why this patch:** Usability testing surfaced two critical gaps: (1) confidence was overstated without paycheck confirmation, and (2) bill deletion had no recovery path.

### What was built
- New screen: `"paycheck-confirm"` inserted after bill review and before CF for newly BV-linked users ✅
- Two paycheck states (simulated in controls):
  - `Detected`: editable detected paycheck, confirm CTA ✅
  - `Not detected`: **primary** direct deposit CTA, secondary manual paycheck fallback ✅
- Confidence model update:
  - `roarmoney-only` + `roarmoney-dd` now `Partial view` (not high confidence) ✅
  - `bv-linked` defaults to `Medium confidence` until paycheck is confirmed ✅
  - High confidence only after paycheck confirmation (detected or DD path) ✅
- Bill review delete safety:
  - `×` now soft-deletes into a restore strip
  - User can tap `Restore` before continuing
  - Removed list is visibly persistent on screen ✅

### Success criteria ✅
- Newly linked users must pass paycheck confirmation before first CF view ✅
- No accidental bill delete is irreversible within the review step ✅
- Confidence badges now reflect financial-picture completeness, not just data freshness ✅

---

## Phase 6 — Manual → BV-Link Reconciliation 🔴 ✅

**Why sixth:** The most complex and novel screen in the project. No precedent in the current prototype. Depends on Phase 5 (bill review gate) being complete since reconciliation follows it in the flow. Requires the most careful UX thinking before building.

**Goal:** When a user who already has manual data links a bank account, their data is cleanly reconciled — not silently overwritten.

**Estimated effort:** 2 sessions

### Trigger (updated with Phase 5A flow)
- User has existing manual data (paycheck + bills entered)
- User links bank and completes: `bill-review` → `paycheck-confirm`
- Reconciliation now appears **after paycheck confirmation** and before CF

### What was built
- New screen: `"reconciliation"` ✅
- Header: "Let's check what changed" ✅
- Subheader: "We compared what you entered with what we found. Review any differences." ✅

### Three row types

| Row type | Appearance | Action | Status |
|---|---|---|---|
| Conflict | "You entered: $850 · We found: $900" | Keep mine / Use detected | ✅ |
| Unmatched manual entry (D2) | "We did not find this — keep it as an obligation?" | Keep / Remove | ✅ |
| New BV-detected (not in manual) | "We found this — add it?" | Add / Skip | ✅ |

- CTA: "Confirm and continue" ✅
- CTA disabled until **all rows resolved** (clear binary action required per row) ✅

### Post-reconciliation behavior
- Unmatched manual entries kept by user persist as obligations (D2) ✅
- Persisted unmatched manual count is shown in CF via a yellow disclosure banner ✅
- Manual archive destination remains Phase 7 settings surface ✅

### Dependencies
- Phase 5 + Phase 5A complete ✅
- D2 locked ✅

### Success criteria ✅
- No conflict is silently resolved without user input ✅
- Every row has a clear binary choice — no ambiguous states ✅
- Reconciliation is only shown when manual data existed pre-link ✅
- CF discloses carried manual obligations after reconciliation ✅

---

## Phase 7 — Cross-Cutting States and Settings 🟡 ✅

**Why seventh:** Depends on all screens being complete, since it stitches them together and provides the settings surface that multiple screens reference.

**Goal:** States and flows that span multiple screens are handled consistently. Dismissed prompts have a recovery path.

**Estimated effort:** 1–2 sessions

### What was built

### Settings surface: Cash Flow settings
- New screen: `"cf-settings"` with entry from Cash Flow nav (gear icon) ✅
- Items:
  - "Improve your accuracy" — routes to link-bank for manual/partial users (D1 path) ✅
  - "Review your bills" — routes to bill-review for linked users ✅
  - "Manual entries" — availability tied to carried manual obligations from reconciliation (D2) ✅

### Per-account freshness display
- Added "Linked account freshness" card on Cash Flow linked/partial profiles ✅
- Each account row shows "Last updated [time]" ✅
- Inline freshness chip per account: `Fresh` / `Stale` based on overlay/staleness state ✅

### Joint account disclosure (D8)
- Persistent "Joint account" badge remains on balance row ✅
- Added note in "How we got this number" when joint balance share is included ✅

### Notification placeholder states (pending O5)
- Added placeholder preview cards in settings:
  - "Low balance alert"
  - "Upcoming bill in 2 days"
- Explicit "preview only" note retained until O5 legal sign-off ✅

### Dependencies
- All previous phases complete ✅
- O5 (notification legal sign-off) still open; placeholders intentionally non-functional ✅

---

## Phase 8 — Connections Hub (Cash Flow Setup) 🟡 ✅

**Why this phase:** The existing onboarding flow dropped users directly into individual downstream screens (link bank → bill review → paycheck confirm → CF) without a durable place to understand their current data coverage, see their confidence score, or know what to do next. New users had no overview; returning users had no easy way back into the setup journey. This phase adds a persistent hub that serves both audiences.

**Goal:** A reusable "Cash Flow Setup" screen that shows the user's current data strength, what we can see vs. guess, and what action to take next — accessible for first-time users and returners alike.

**Estimated effort:** 1 session

### What was built

**New screen: `"connections"`**
- Header: "Cash Flow" nav title + "SET UP" breadcrumb with 3-dot animated progress indicator (fills as setup deepens: empty → partial → partial+ → full)
- Heading switches by state: "Build your Cash Flow picture" (new-user) / "Add where bills and spend hit" (returning)
- Supporting copy tied to outcomes, not generic data-grab framing

**Confidence module**
- Numeric score `/100` derived from existing `confidenceBadge` logic — no new scoring model
- Score mapping added: `CONF_SCORE` record (`High = 92`, `Medium = 58`, `Partial view = 45`, `Manual = 35`, `Still learning = 25`, `Getting started = 0`, `Unreliable = 10`)
- Animated progress bar (teal/yellow/red based on score range)
- Tier badge reuses existing `CONF_COLOR` / `CONF_BG` tokens
- 1-line contextual "next step" hint adapts to every state

**Connected accounts section**
- State-aware account list:
  - RoarMoney: shown for all non-manual, non-new-user states; badge = `PAYCHECK PATTERN` (RoarMoney-only) or `DIRECT DEPOSIT` (DD path) or `INCOME DETECTED` (bv-linked)
  - Chase checking: shown for `bv-linked` state with `INCOME DETECTED` badge
  - Manual profile: shown for `manual-only` with `MANUAL DATA` badge
  - Empty state copy for new users
- "LINK ANOTHER ACCOUNT" suggestion rows (Chase, Bank of America with "TYPICAL NEXT STEP" label) when no external link exists

**What we can see vs guess section**
- Two items: Income & payday timing / Bills, subs & everyday spend
- Teal filled checkmark = seen, yellow `~` = partial/estimated, empty circle = guessing
- Copy for each item adapts to state (confirmed, partial, guessing)

**Contextual CTAs (one primary per state)**

| State | Primary CTA |
|---|---|
| New-user | "Link my bank account →" (teal) + "Enter my info manually" (text) |
| Manual / RoarMoney / RoarMoney+DD | "Link another account →" (black) |
| BV-linked, income unconfirmed | "Link another account →" (black) + "Confirm my paycheck →" (outline) |
| BV-linked, income confirmed | "Link another account →" + "View my Cash Flow →" |
| Reconnect needed | "Reconnect Chase →" (red) |

**Routing**

| Touch point | Before | After |
|---|---|---|
| New-user taps Cash Flow widget | went to `connections` directly | now goes to `splash` first (feature intro) |
| Splash primary CTA | "Connect my bank →" → `link-bank` | "Continue →" → `connections` |
| Confidence badge chip on CF screen | non-interactive label | tappable button — routes to `connections` |
| AccountsScreen (all returning states) | No hub entry | "Cash Flow Setup" row added below the CF widget |
| CF Settings screen | "Improve your accuracy" only | "Connections" row added as first entry |

**Post-initial iteration (same session)**
- Splash CTA label changed from "Connect my bank →" to "Continue →" and re-routed to `connections` instead of `link-bank`. Splash now serves as the feature intro/value prop; `connections` is the true setup entry point where users choose to link or enter manually.
- Confidence badge chip on `CashFlowScreen` is now an interactive button. Tapping it navigates to the Connections hub, giving users a direct path to improve their score mid-flow without navigating through Settings.

### States demoed via controls panel

All 7 states reachable by combining "Widget / profile state" + "Linked state overlay" chips:
- New-user empty
- Manual-only
- RoarMoney-only (partial)
- RoarMoney + Plaid DD
- BV-linked medium (income unconfirmed)
- BV-linked high (income confirmed — set via paycheck-confirm flow)
- Reconnect needed

### Dependencies
- Phases 1–7 complete ✅
- Uses existing `accountState`, `linkedOverlay`, `linkedIncomeStatus` — no new state added

### Success criteria ✅
- Every state shows exactly one primary action ✅
- "What we can see vs guess" updates correctly for all account states ✅
- Confidence score and progress bar reflect the same label logic as `CashFlowScreen` ✅
- First-time new users see splash first, then land on `connections` via "Continue →"; returning users via Accounts row and CF Settings ✅
- Confidence badge chip on CF screen is tappable and routes to connections hub ✅
- No dead ends — every state has a back route to Accounts ✅

---

## Final Phase — Polish, Edge Cases, and Iteration 🟡 ⬜

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

### Future-state guardrails (locked now, build later)
- Live transaction-reactive STS is out of v1 scope and gated to BV-linked + high confidence users only (D18)
- If confidence drops below high (stale/reconnect/missing paycheck), STS reverts to snapshot mode with explicit messaging
- Manual post-link obligations remain fixed recurring entries first; future auto-detection may suggest merge/replace, never silent overwrite (D17)

---

## Phase 9 — RoarMoney DD Gating: State + PaycheckConfirmScreen 🟡 ⬜

**Why this phase:** Direct deposit requires a RoarMoney account (routing + account numbers). Users who only have a linked external account (e.g., Chase via Plaid) cannot set up DD into MoneyLion. Every "Set up direct deposit" CTA in the prototype was previously shown to all users regardless of RoarMoney status, which is misleading for non-RM users. This phase adds the structural state and gates the income confirmation flow.

**Goal:** Introduce `hasRoarMoney` as a first-class state flag. Gate all DD paths in `PaycheckConfirmScreen` so non-RM users see a soft RoarMoney cross-sell instead of a direct DD setup action.

**Estimated effort:** 1 session

### What will be built

**New state: `hasRoarMoney` (boolean)**
- Added at App level alongside `accountState`, `linkedIncomeStatus`, etc.
- Default: `false`
- Auto-syncs with `accountState`: `roarmoney-only` / `roarmoney-dd` = `true`; `new-user` / `manual-only` / `bv-linked` = `false`
- Can be manually overridden via demo controls for edge-case testing (e.g., BV-linked user who also has RM)

**Demo controls: "Has RoarMoney" toggle**
- Added to Onboarding flags section of the prototype controls panel
- Styled like existing "Simulate joint account" / "Simulate low history" toggles
- Auto-syncs with `accountState` changes but supports manual override

**PaycheckConfirmScreen gating**

| Signal state | Has RoarMoney | Behavior |
|---|---|---|
| Detected (paycheck found) | Yes | Unchanged: "Set up direct deposit instead" outline button |
| Detected (paycheck found) | No | Replace DD button with soft cross-sell card (Teal-100 bg, "Learn about RoarMoney" CTA) |
| Not detected (no paycheck) | Yes | Unchanged: DD recommended card + "Set up direct deposit" primary CTA |
| Not detected (no paycheck) | No | DD card becomes RM cross-sell; manual entry promoted to primary action path |

### Dependencies
- Phases 1–8 complete ✅
- No new screens; modifies existing `PaycheckConfirmScreen` and App-level state

### Success criteria
- [ ] "Has RoarMoney" toggle visible in demo controls and auto-syncs with account state chips
- [ ] PaycheckConfirmScreen (detected): non-RM users see cross-sell card, not DD button
- [ ] PaycheckConfirmScreen (not-detected): non-RM users see manual entry as primary path, RM as upsell
- [ ] RM users see unchanged DD behavior in both branches
- [ ] No regressions in confidence scoring or navigation

---

## Phase 10 — RoarMoney DD Gating: ConnectionsScreen + Documentation 🟡 ⬜

**Why this phase:** With Phase 9's `hasRoarMoney` state in place, the Connections hub needs to reflect the same product reality. RM users who haven't set up DD should see a clear upgrade path. Non-RM users should not be nudged toward DD since they can't act on it without a separate RM onboarding.

**Goal:** Add a conditional DD upgrade card to the Connections hub for RM users. Adjust income row copy to remove DD references for non-RM users. Document the full RoarMoney gating pattern.

**Estimated effort:** 1 session

### What will be built

**ConnectionsScreen: DD upgrade card**
- Positioned between "What we can see vs guess" and "Connected accounts" cards
- Only renders when ALL conditions are true:
  - `hasRoarMoney === true`
  - `linkedIncomeStatus !== "dd"` (DD not already active)
  - `accountState !== "new-user"`
- Content: Teal-100 bg, title "Get paid up to 2 days early", body explaining DD benefits for Cash Flow confidence + early paycheck access, outline CTA "Set up direct deposit"
- For non-RM users: card does not render. They've reached their confidence ceiling without RM onboarding.

**ConnectionsScreen: income row copy adjustments**

| State | Has RM | Copy change |
|---|---|---|
| `linkedIncomeStatus === "confirmed"`, linked | Yes | Add subtle upgrade hint: "Get exact payday amounts. Set up direct deposit." with teal link |
| `linkedIncomeStatus === "confirmed"`, linked | No | Clean copy: "$1,400 biweekly, confirmed" + "Detected from your linked bank account." No DD mention |
| All other states | Either | No changes |

### State matrix (full reference)

| User type | Income paths shown | DD CTA | Confidence ceiling |
|---|---|---|---|
| New user, no RM | Manual, Link bank | Hidden | Getting started |
| Manual only, no RM | Edit paycheck, Link bank | Hidden | Manual estimate |
| BV-linked, no RM | Confirm detected, Manual | Cross-sell card ("Learn about RM") | High confidence |
| BV-linked, has RM | Confirm detected, Manual, DD | "Set up direct deposit" (active) | High confidence |
| RM only | Link external, DD | "Set up direct deposit" (active) | Partial view |
| RM + DD | All complete | Already done | High confidence |

### Confidence model: no changes
- `"confirmed"` and `"dd"` both map to "High confidence" in the UI
- The product difference (confirmed pattern vs actual DD rails) is a data-quality distinction, not a confidence-label distinction at this stage

### Dependencies
- Phase 9 complete (provides `hasRoarMoney` state and demo toggle)

### Success criteria
- [ ] DD upgrade card renders only for RM users who haven't set up DD
- [ ] DD upgrade card hidden for non-RM users and new users
- [ ] Income row copy for confirmed + no-RM does not mention direct deposit
- [ ] Income row copy for confirmed + has-RM includes DD upgrade hint
- [ ] No regressions in Connections hub layout across all 7 demo states

---

## Phase 11 — Confidence Tier Recalibration 🟡 ✅ *(documentation stub)*

**Why this phase:** Phase 10 mapped both `confirmed` and `dd` income states to "High confidence," which overstated the accuracy of bank-verified-only income. BV detection is pattern-based and can miss edge cases; DD provides deterministic paycheck timing and amount. Compressing both into the same tier weakened the incentive to set up DD and misled users about their picture.

**Goal:** Introduce a "Good confidence" tier between Medium and High, reserving "High confidence" exclusively for DD. Rewire every confidence consumer to the new map.

**What shipped (in code)**
- Added `"Good confidence"` to the `Confidence` type
- `CONF_SCORE` map: Good confidence = 72, High confidence = 92
- `CONF_COLOR` / `CONF_BG`: Good confidence reuses teal-dark / teal-100 (accent-positive)
- Badge logic updated in `CashFlowWidget`, `CashFlowScreen`, `ConnectionsScreen`
- Copy updated so "full-confidence" language is reserved for DD only

**Success criteria ✅**
- [x] BV-linked + confirmed income (no DD) = Good confidence, not High
- [x] RM + DD (no BV link) = High confidence
- [x] BV-linked + DD = High confidence
- [x] Unconfirmed bank-detected = Medium confidence
- [x] Scoring stays on the same 0-100 scale, with 72 / 92 anchors

---

## Phase 12 — Cash / Gig Income Support 🟡 ✅ *(documentation stub)*

**Why this phase:** A meaningful segment of MoneyLion's stretched-household users are paid fully or partially in cash (gig workers, service workers, side hustles, lower-income tiers). Forcing them through "Paycheck amount" + "Next pay date" misrepresents their reality and produces wrong Cash Flow math. Detecting income in their bank account is impossible because the money never touches the bank until they deposit it.

**Goal:** Give cash-earners a first-class entry path, distinct UI treatment on the Connections hub, and a meaningful upgrade path (deposit cash into RoarMoney → build a transaction trail → eventually raise confidence).

**What shipped (in code)**
- `ManualPaycheckScreen` adds an income type selector: `"regular" | "cash" | "gig"`
- Cash / gig flow captures amount + steadiness instead of payday + frequency
- New `handleManualCashContinue` handler (Phase 13a refactors it to push a `cash-gig` `IncomeSource`)
- `ConnectionsScreen` renders a distinct "cash income" row when the user is on the cash path
- Next-action hint copy differentiates: non-RM cash users get a "keep estimate accurate" nudge; RM cash users get a soft "deposit cash into RoarMoney" upgrade nudge

**Success criteria ✅**
- [x] Manual paycheck screen surfaces the income type selector
- [x] Cash / gig path skips `Next pay date` and asks about steadiness instead
- [x] Connections hub income row shows distinct copy for cash users
- [x] Confidence ceiling for cash-only users stays at "Manual estimate" in Phase 12 (Phase 14+ may revisit once deposit trail exists)

---

## Phase 13a — Income Data Model Refactor (invisible) 🟡 ✅

**Why this phase:** The entire income system was keyed off a single `LinkedIncomeStatus` enum (`"unconfirmed" | "confirmed" | "manual" | "dd" | "cash"`). This forced every user to have exactly one income source, collapsed DD + cash into a single state, and blocked the natural next request: *"I have DD AND a cash side hustle — show both."* Every consumer also had to duplicate the same chain of string comparisons (`status === "confirmed" || status === "dd"`), which was brittle and easy to get wrong.

**Goal:** Swap the single-enum model for an `IncomeSource[]` array without changing a single visible pixel. This is a pure plumbing change so Phase 13b can build the multi-source UI on top of a stable foundation.

**Estimated effort:** 1 session

### What was built

**New types (`cashflow-prototype/src/App.tsx`)**
```ts
type IncomeKind   = "bank-detected" | "manual" | "dd" | "cash-gig";
type IncomeStatus = "confirmed" | "unconfirmed";
interface IncomeSource {
  id: string;
  kind: IncomeKind;
  label: string;
  amount: number;
  frequency: PayFreq;
  status: IncomeStatus;
  steadiness?: "steady" | "variable" | "highly-variable";
}
```

**Central derived helper**
```ts
function getIncomeHelpers(incomes: IncomeSource[]): IncomeHelpers
// returns: hasDD, hasConfirmedBank, hasUnconfirmedBank, hasManual, hasCash, anyIncome, incomeConfirmed
```
Every consumer calls `getIncomeHelpers(incomes)` once and reads booleans. No component touches the raw array yet — that's Phase 13b.

**State swap**
- Removed: `const [linkedIncomeStatus, setLinkedIncomeStatus] = useState<LinkedIncomeStatus>("unconfirmed")`
- Added: `const [incomes, setIncomes] = useState<IncomeSource[]>([])`
- Removed the `LinkedIncomeStatus` type entirely

**Handlers rewritten to push `IncomeSource` objects**

| Handler | Old behavior | New behavior |
|---|---|---|
| `handleConnected` | `setLinkedIncomeStatus("unconfirmed")` | Removes any prior `bank-detected`, pushes fresh `{ kind: "bank-detected", status: "unconfirmed", amount: 1400, frequency: "biweekly" }` |
| `handleIncomeDetectedConfirm` | `setLinkedIncomeStatus("confirmed")` | Flips the existing `bank-detected` + `unconfirmed` source to `status: "confirmed"` |
| `handleIncomeManualConfirm` | `setLinkedIncomeStatus("manual")` | Removes `bank-detected` + any prior `manual`, pushes fresh manual source |
| `handleIncomeDDConfirm` | `setLinkedIncomeStatus("dd")` | Removes `bank-detected` + any prior `dd`, pushes fresh `dd` source |
| `handleManualCashContinue` | `setLinkedIncomeStatus("cash")` | Removes any prior `cash-gig`, pushes fresh `cash-gig` source with steadiness |
| `handleManualDone` (new) | *(no-op on income)* | If no manual or cash source exists, pushes a default manual source so downstream helpers are consistent |

**Reset flow**
- `setLinkedIncomeStatus("unconfirmed")` → `setIncomes([])`

**Consumers refactored (all visual output preserved)**
- `CashFlowWidget` — confidence badge + "Safe to Spend" subtitle now keyed off `hasDD / hasConfirmedBank`
- `CashFlowScreen` — confidence badge + "Income signal needs confirmation" banner use the helpers
- `ConnectionsScreen` — confidence label, next-action hint, income row copy, DD upgrade card visibility all consume the helpers
- `AccountsScreen` — passes `incomes` through to `CashFlowWidget`
- `PaycheckConfirmScreen` — unchanged signature (handlers do the work)

### Mapping: old string check → new helper

| Old check | New check |
|---|---|
| `linkedIncomeStatus === "dd"` | `hasDD` |
| `linkedIncomeStatus === "confirmed"` | `hasConfirmedBank` |
| `linkedIncomeStatus === "cash"` | `hasCash` |
| `linkedIncomeStatus === "confirmed" \|\| linkedIncomeStatus === "dd"` | `hasDD \|\| hasConfirmedBank` (bank-confirmed union) |
| `linkedIncomeStatus !== "confirmed" && linkedIncomeStatus !== "dd"` | `!(hasDD \|\| hasConfirmedBank)` |
| Implicit "user has some income" | `anyIncome` |

### Confidence tier logic (unchanged outputs, new inputs)

```ts
isNewUser                                   → "Getting started"
isReconnect                                 → "Unreliable"
isStillLearning                             → "Still learning"
isRoarOnly || isRoarDD                      → "Partial view"
isLinked && hasDD                           → "High confidence" (92)
isLinked && hasConfirmedBank                → "Good confidence"  (72)
isLinked                                    → "Medium confidence"
else                                        → "Manual estimate"
```

### Dependencies
- Phases 1-12 complete ✅
- No new UI, no new copy, no new states

### Success criteria ✅
- [x] `LinkedIncomeStatus` type removed from the codebase (`rg LinkedIncomeStatus src/` returns nothing)
- [x] All consumers read from `getIncomeHelpers(incomes)` instead of enum string checks
- [x] Handler chain still moves through `link-bank → bill-review → paycheck-confirm → connections` identically
- [x] Reset flow clears `incomes` to `[]`
- [x] `tsc --noEmit` introduces zero new errors (pre-existing `totalBalanceFor` / `T.borderAccent` errors remain)
- [x] Prototype visual output is byte-for-byte identical to pre-refactor across every demo state (new-user, manual-only, RM-only, RM+DD, BV-linked at each confidence tier, cash-gig, reconnect, still-learning)

### Why split this out from 13b
The array model is a big internal change. Shipping it invisibly first means:
1. We can validate no regressions before adding any new UI surface
2. Phase 13b becomes a pure additive change (add cards, add buttons) on top of a known-good foundation
3. If the data-model refactor breaks something, we can revert one phase, not two

---

## Phase 13b — Multi-Source UI (additive) 🟡 ✅

**Why this phase:** Users have multiple income streams in real life — DD plus cash tips, two part-time paychecks, a main job plus a 1099 side hustle. Collapsing all of these into one row on the Connections hub hides the shape of someone's income and limits how accurately we can project Cash Flow. Phase 13a made the data model support this; 13b makes the UI reflect it.

**Goal:** Expose the `incomes` array in the UI. Let users see every source on the Connections hub, add additional sources from the hub or from the manual flow, and edit or remove any source.

### Scope decisions (locked during build)

- **Single-per-kind invariant** kept for 13b MVP. The array model supports multiples; loosening this is a Phase 13c concern. `+ Add another income` hides options that would collide (no "Enter manually" when a manual source already exists).
- **Edit enabled for `manual` + `cash-gig` only.** `dd` and `bank-detected` aren't user-editable values — they're pulled or pattern-detected. Their sheet shows a read-only explanation + a Remove action only.
- **Remove available for every kind.** Removing bank-detected / DD is effectively a "disconnect income" action from the user's mental model.
- **Bottom sheet pattern, stacked buttons** (MLDS Dialog 3.0 convention). Side-by-side is explicitly DO NOT USE.
- **"Your income" card lives between the confidence module and "What we can see vs guess"**, not inside the guess card. Separation: income cards are the source-of-truth editable list; the signal dot in the guess card stays as a coarse summary.

### What shipped

**Connections hub: stacked income list**
- New `YOUR INCOME` card section renders one `IncomeSourceCard` per entry in `incomes`, with a header count chip ("2 sources")
- Each card shows icon (per-kind), label, amount + frequency + source context, and a status pill (confirmed / needs review / cash-gig / manual)
- Tap behavior: bank-detected + unconfirmed → routes to the existing paycheck-confirm flow; all others → opens `EditIncomeSheet`
- Below the stack: dashed `+ Add an income source` / `+ Add another income` button → opens `AddIncomeSheet`
- Empty state: "No income added yet" with short reassurance copy

**`AddIncomeSheet` (new component)**
- Bottom sheet overlay with backdrop dismiss
- Dynamically filters options to respect the single-per-kind invariant (hides "Enter manually" if user already has a manual source, etc.)
- DD option:
  - `hasRoarMoney` → enabled; tapping it calls `onAddDD` which appends a DD income source and sets accountState to `roarmoney-dd`
  - `!hasRoarMoney` → disabled with subtitle "Requires RoarMoney" — soft-gated, visible so the path is discoverable
- Cancel button returns without changes

**`EditIncomeSheet` (new component)**
- Bottom sheet with label, amount, and frequency inputs (`manual` + `cash-gig` only) + a destructive `Remove income source` button for all kinds
- For `dd` + `bank-detected`: fields are hidden, replaced with a short explanation of why the value is fixed
- Save closes the sheet and calls `onUpdateIncome(id, patch)`; Remove calls `onRemoveIncome(id)`

**`ManualPaycheckScreen`: multi-entry support**
- Accepts `incomes` + `onSaveAdditional` props
- When `incomes.length > 0`: renders an `ALREADY ADDED (n)` summary card at the top listing saved sources
- When additional-save is supported: renders a secondary `Save and add another` dashed button under `Continue` — saves the current form to `incomes` (replacing same-kind by invariant), resets the form, auto-flips the type selector (regular → cash or cash → regular) so the user can add the other kind without re-clicking

**Per-kind copy helpers (`getIncomeLabel`, `getIncomeSubtitle`, `getIncomeIcon`, `getIncomeIconBg`)**

| Kind | Label | Subtitle | Icon | Icon bg |
|---|---|---|---|---|
| `dd` | Direct deposit | `$X biweekly · Auto-confirmed` | 🏦 | Teal-100 |
| `bank-detected` (confirmed) | Main paycheck | `$X biweekly · Detected from linked bank` | 📈 | Teal-100 |
| `bank-detected` (unconfirmed) | Paycheck detected | `$X biweekly · Needs confirmation` | 📈 | Yellow-100 |
| `manual` | Main paycheck | `$X biweekly · You entered this` | ✏️ | Yellow-100 |
| `cash-gig` | Cash income | `~$X weekly · Cash, variable` (+ steadiness variants) | 💵 | Purple-100 |

**Demo presets (new `Multi-income preset` control group)**
- `DD + cash` — sets `hasRoarMoney=true`, `accountState=roarmoney-dd`, seeds DD ($1,600 biweekly) + cash-gig ($250 weekly, variable) and routes to the hub
- `BV + manual side` — BV-linked main paycheck ($1,400 biweekly, confirmed) + manual side income ($600 monthly)
- `Cash + manual` — manual W-2 ($2,200 biweekly) + cash tips ($300 weekly, steady)

**State helpers restored on `App`**
- `addIncome(src)`, `updateIncome(id, patch)`, `removeIncome(id)` — used by sheet callbacks and preset actions
- A new inline `onAddDD` handler preserves other sources (doesn't call the legacy `handleIncomeDDConfirm` which would wipe bank-detected)

### Data model mapping (unchanged from 13a)

13b is pure UI: no new fields, no type changes. Reads and writes to the same `IncomeSource[]` via the 13a helpers.

### Dependencies
- Phase 13a complete ✅ (array model, helpers, handler rewrites)

### Success criteria
- [x] Connections hub renders one card per income source
- [x] Users can add a second source from the hub without leaving the flow (via `AddIncomeSheet`)
- [x] Users can edit or remove any source (edit for manual/cash-gig, remove for all)
- [x] `hasDD && hasCash` state renders correctly (both cards visible, confidence still reflects DD tier = "High confidence" 92)
- [x] Typecheck clean (`tsc --noEmit` passes with 0 errors)
- [x] No regression in existing single-source demo states (new-user, manual-only, RoarMoney-only, RoarMoney+DD, BV-linked pre/post-confirm, cash-gig)
- [x] New "DD + cash", "BV + manual side", "Cash + manual" demo presets jump directly to a populated hub

### Known limitations / out of scope (Phase 13c candidates)
- Single-per-kind invariant means side-hustlers can't add two cash streams or two manuals yet. Model supports it; UI does not.
- Edit sheet for bank-detected / DD is read-only. If users want to change the detected amount, they must remove and re-add.
- `AddIncomeSheet` DD option with `!hasRoarMoney` is disabled rather than linking into RoarMoney onboarding. Soft CTA copy present; deep link pending RoarMoney flow integration.
- `ManualPaycheckScreen` onboarding flow still routes through bills review before returning to the hub — the hub-initiated "Enter manually" path would ideally skip bills review, but that requires threading a return-to-hub flag. Out of scope for 13b.

---

## Final Phase — Polish, Edge Cases, and Iteration 🟡 ⬜

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

### Future-state guardrails (locked now, build later)
- Live transaction-reactive STS is out of v1 scope and gated to BV-linked + high confidence users only (D18)
- If confidence drops below high (stale/reconnect/missing paycheck), STS reverts to snapshot mode with explicit messaging
- Manual post-link obligations remain fixed recurring entries first; future auto-detection may suggest merge/replace, never silent overwrite (D17)

---

## Phase 13c — Cash Flow Setup Polish 🟡 ✅

**Goal:** Four targeted improvements to the Connections Hub and manual income entry based on design review feedback.

**Effort:** Small-medium (single session, additive, no breaking changes).

**Dependency:** Phase 13b complete.

### What shipped

**1. One-time Cash/Gig income**
- Extended `IncomeSource` with optional `occurrence?: "recurring" | "one-time"` and `date?: string` (backward compatible, absence = recurring)
- `ManualPaycheckScreen` cash/gig flow gains a "Regular vs One-time" chip toggle; selecting one-time shows a date picker and hides frequency/steadiness
- `getIncomeSubtitle` returns `$500 on Apr 20` (past) or `$500 expected Apr 25` (future) for one-time sources
- `IncomeSourceCard` shows a `ONE-TIME` status chip in purple for one-time sources
- `EditIncomeSheet` adapts for one-time: shows date field instead of frequency picker
- `onContinueCash` now accepts `Omit<IncomeSource, "id">` so the screen passes through occurrence + date to App state

**2. Safe-to-spend impact**
- New `getOneTimeImpact(incomes)` helper returns `{ receivedBoost, nextOneTimePayday }`
- `CashFlowScreen` hero: past one-time amounts added to displayed safe-to-spend; nearest future one-time date overrides next-payday copy

**3. New-user gating on Connections Hub**
- While `accountState === "new-user"`: the "+ Add an income source" button is hidden and income card taps are no-ops
- Empty state copy updated to "Complete your initial setup to start tracking income"
- Once `accountState !== "new-user"`, Add button and tap-to-edit behave normally

**4. Card spillover fix**
- `ConnectionsScreen` root div: `width:"100%", minWidth:0`
- Content grid: `minWidth:0`
- Confidence card header: left child gets `flex:1, minWidth:0`; right badge gets `flexShrink:0`
- Your Income header: same flex/minWidth treatment
- App scrollable content div: added `overflowX:"hidden", minWidth:0`

**5. Card reorder**
- Hub order: Confidence module, then "What we can see vs Guess", then "Your Income" (previously Income was above What we can see)

### Success criteria
- [x] One-time cash income saves with correct `occurrence` + `date` fields
- [x] Past-date one-time income adds to safe-to-spend number; future-date shows as next expected
- [x] Status chip shows `ONE-TIME` in purple for one-time sources
- [x] New user cannot tap income cards or see Add button on Connections Hub
- [x] Cards no longer spill beyond phone frame right edge
- [x] "What we can see vs Guess" renders above "Your Income" on the hub
- [x] `tsc` compiles clean, no new type errors introduced

### Known limitations / out of scope (Phase 13d candidates)
- Variable amounts per one-time occurrence (currently fixed amount per entry)
- Multiple one-time events on a single IncomeSource (each is its own entry)
- Safe-to-spend ring visualization math not updated (hero number only)
- One-time cash income does not affect confidence score (informational for scoring)

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

Phase 8                  Phase 9                   Phase 10
────────────────────     ────────────────────────   ────────────────────────
Connections Hub          RoarMoney DD gating:       RoarMoney DD gating:
(Cash Flow Setup)        state + paycheck screen    connections + docs

                                    ↓

Phase 11                 Phase 12                  Phase 13a
────────────────────     ────────────────────────  ────────────────────────
Confidence tier          Cash / gig income         Income data model
recalibration            support (grandma-ux)      refactor (invisible)
(Good vs High)

                                    ↓

                              Phase 13b
                         ────────────────────────
                         Multi-source income UI
                         (additive)

                                    ↓

                              Phase 13c
                         ────────────────────────
                         One-time income, gating,
                         overflow fix, reorder

                                    ↓

                              Final Phase
                         ────────────────────────
                         Polish, edge cases,
                         accessibility, metrics
```

**Phases 2 and 3** are built together — same component, same session.
**Phase 6** is intentionally last among new screens — highest complexity, novel UX pattern, depends on Phase 5.
**Phase 8** slots after Phase 7 — depends on all account states and CF screen being stable before the hub is built on top.
**Phases 9 and 10** layer RoarMoney awareness onto the existing prototype. Phase 9 is structural (state + paycheck screen); Phase 10 consumes that state in the Connections hub.
**Phase 11** recalibrates the confidence map so DD earns its own tier above bank-detected-confirmed.
**Phase 12** adds first-class support for cash earners — a distinct path that doesn't fake a payday.
**Phase 13a** flips the income data model to an array in pure plumbing, zero visual change.
**Phase 13b** exposes that array in the UI — multiple income cards, add / edit / remove.
**Phase 13c** polishes the hub: one-time cash income, new-user gating, overflow fix, card reorder.
**No phase should start until the one before it is marked ✅.**

---

*Last updated: April 17, 2026 (Phase 13c shipped)*
*Source: Design sessions with [Jaf Inas / PFM Team] — Cash Flow v1*
