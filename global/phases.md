# Cash Flow — Build Phases

> **Purpose:** Working reference for design and build order. Update status markers as each phase completes.
> **Last updated:** April 9, 2026 (Phases 1–6 complete + Confidence/Paycheck patch)
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

*Last updated: April 9, 2026*
*Source: Design sessions with [Jaf Inas / PFM Team] — Cash Flow v1*
