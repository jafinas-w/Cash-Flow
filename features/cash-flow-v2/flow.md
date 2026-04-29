# Cashflow V2 — Flow Breakdown

> **Status:** Phase A locked. Phase B (dashboard) appended after ideation.
> **Companion:** `phases.md`
> **Prototype:** `prototypes/CashFlowV2Draft.canvas.tsx` (build pending Phase B lock)

---

## Phase A — Onboarding & handoff to dashboard

### User goal entering Phase A

A returning MoneyLion user taps the Cashflow tab. They want to know, in order:
1. Is my money okay right now?
2. Does this product actually understand my money?
3. What should I do next, if anything?

Phase A's job is to answer (2) before the dashboard answers (1) and (3). It must do this without feeling like a setup chore.

**Emotional state entering:** Mild curiosity, low patience. Possibly stressed (Stretched user mid-paycheck-cycle). Will abandon if the screen feels like work.

---

### Entry decision tree

```
Tap Cashflow tab from bottom nav
    ↓
[ First-time visitor to Cashflow? ]
    ├── Yes →  Splash carousel (Screen A0)
    │           ↓ tap "Continue" through 3 pages
    │           ↓
    │           [ Has bv-linked account? ]
    │              ├── No  →  Linking gate (Screen A1)
    │              │           ↓ link flow (existing, out of V2 scope)
    │              │           ↓
    │              └── Yes →  Overview (Screen A2)
    │                           ↓ tap "View my Cashflow"
    │                           ↓
    └── Return visit →  Dashboard (Phase B)
                          ↑ Overview reachable via "Improve forecast" link from dashboard
```

**Design intent**
- **Splash** sells the value prop. Every first-timer sees it once, regardless of link state. It earns the right to ask for a bank link by showing what the user gets in return.
- **Overview** is a setup/transparency surface, not a daily-use screen. After first visit, route users straight to the dashboard. Make Overview reachable from the dashboard, never blocking.

**Detection timing reality:** After a user links a bv account, transaction analysis can take up to 24 hours to surface paycheck and bill patterns. This means a user can complete Overview, see `Bank ✓ / Paycheck ⊝ / Bills ⊝`, view the dashboard with a `Building your view` chip, close the app, and return the next day to a fully populated dashboard with no further input required. Two implications:

- **Overview must always allow handoff to dashboard**, even when only the bank pillar is detected. Never block on detection completion.
- **Returning users mid-detection-window should not see the Overview again** unless they tap into it. The dashboard silently updates when detection completes — no notification, no celebration moment in Phase 1.

---

### Screen A0 — Splash carousel (first-time visitors, all states)

**Purpose:** Sell the Cashflow value prop to every first-time visitor before they're asked to do anything. This is the only screen in the entire flow that exists purely to set context. Returning users never see it.

**Format:** 3-page horizontal carousel with a **persistent CTA**. The CTA is available on page 1; users can advance to the dashboard at any time without swiping through pages 2 and 3. The carousel is enrichment, not a gate.

**Implication:** Page 1 must stand on its own. Pages 2 and 3 are bonus context for users who want to learn more before continuing. Don't write copy that depends on sequence ("Now that you've seen…") or that's only resolvable after page 3.

**Page 1 — See (provided):**

```
[Status bar]
[Back arrow, top-left]

[Hero illustration — paycheck + chart + bills + card,
 contextual color palette, 3D iso style]

Headline:    "See your future clearly. Stay ahead."
Subhead:     "Cash Flow shows exactly how much you can spend
             before your next paycheck, after every bill."

[Page indicator: ● ○ ○]

[Button 3.0 — Primary, Large, full width: "Continue"]
[Footer microcopy — TBD]
```

**Pages 2 and 3 — locked (See / Cover / Grow direction):**

Carousel maps to the three jobs the dashboard does, in the order a stressed user feels them.

| Page | Pillar | Headline | Subhead |
|---|---|---|---|
| 1 | See | "See your future clearly. Stay ahead." | "Cash Flow shows exactly how much you can spend before your next paycheck, after every bill." |
| 2 | Cover | "Know when things get tight." | "We'll flag a shortfall before it shows up at the register, so you can get ahead of it." |
| 3 | Grow | "Turn breathing room into momentum." | "When you have surplus, we'll help you put it to work, so every paycheck moves you forward." |

Sequence: I see clearly → I'm covered when stretched → I'm building when stable. Previews the three dashboard states.

**MLDS components**
- `Navigation Bar 3.0` (back arrow only, no title)
- Custom illustration per page (existing MoneyLion contextual style)
- Page indicator (3-dot, MLDS pattern unconfirmed — likely a `Progress/Linear Steps` variant or custom)
- `Button 3.0` (Primary Large)

**States**
- Default page 1, 2, 3
- Mid-swipe (rubber-band)
- **CTA copy is link-state aware.**
  - Linked user (~85%): CTA reads `Continue`. Tap → A2 Overview (whichever detection state applies).
  - Unlinked user (~15%): CTA reads `Link your bank`. Tap → A1 Linking gate. Below the CTA, a one-line trust microcopy reads `Bank-level encryption · Read-only access · Disconnect anytime`.
- The CTA being explicit for unlinked users sets expectations clearly — they know the next tap leads to a linking flow, not a continuation of marketing. Trade-off: a tiny edge case where a user's link state is unknown (e.g., session expired) defaults to `Continue` and routes through A2's link-state check.

**Edge cases**
- User taps back arrow on page 1 → exit Cashflow, return to home tab.
- User dismisses mid-carousel and returns later — first-time flag persists. They should resume where they left off, not restart at page 1.
- Reduced motion — carousel respects `prefers-reduced-motion`; no auto-advance ever.

**Copy guidance**
- Footer microcopy ("Lorem ipsum...") needs replacement. Recommendation: legal/disclosure footer is not appropriate here — drop it entirely. The splash should feel like a story, not a contract.
- Pages must work in any order if user swipes back and forward freely. Don't write copy that assumes sequence ("Now that you've seen…").

**Transition out**
- Final page CTA tap → A1 (unlinked) or A2 (linked).
- Splash is shown once per user lifetime. Re-onboarding (e.g., after account close + re-open) is a Phase 2 question.

---

### Screen A1 — Linking gate (unlinked users, post-splash)

**Purpose:** Convert the 15% of users without a bv-linked account into linked users. The splash has already sold the value prop, so this screen is short and functional, not motivational.

**Layout (light mode, 390px):**

```
[Status bar]
[Navigation Bar 3.0 — back arrow, "Cash Flow" title, help icon]

[Compact illustration — bank/connection metaphor, smaller than splash]

Headline:    "Link your bank to get started"
Subhead:     "We'll find your paycheck, bills, and safe-to-spend
             automatically. No setup forms."

[Trust microcopy: "Bank-level encryption. We never store your login."]

[Button 3.0 — Primary, Large, full width: "Link your bank"]
[Button 3.0 — Transparent, Large, full width: "Maybe later"]
```

**MLDS components**
- `Navigation Bar 3.0` (Title only variant)
- `Button 3.0` (Primary Large; Transparent Large)
- Custom illustration (compact, matched to splash style)

**States**
- Default (above)
- Loading (after tap on "Link your bank") — `Progress/Circular` overlay, button disabled
- Linking failure — return to this screen with a toast (`Sticky Note 3.0` in error treatment): "We couldn't connect. Try again?"

**Copy notes**
- `No setup forms` reinforces the no-manual-entry promise from the start. Anti-anxiety move for users who've been burned by 12-step budget app onboardings.
- `Maybe later` is a soft escape; it routes back to home, not to a degraded dashboard. Phase 1 has no demo dashboard.

**Transition out**
- Tap `Link your bank` → existing MoneyLion linking flow → on success, route to **Screen A2 in the `Building your view` state**. Detection takes up to 24h, so the very first post-link Overview is always Building. Dashboard silently updates when detection completes (per D6).
- Tap `Maybe later` → exit Cashflow back to home tab. No degraded dashboard preview in Phase 1 (per D16).

---

### Screen A2 — Overview ("See exactly where your money stands")

**Purpose:** Show our work. Build trust by exposing what was detected. Offer two progressive enhancement actions. Never block on confirmation.

**Layout (light mode, 390px):**

```
[Status bar]
[Navigation Bar 3.0 — back, "Cash Flow", help]

Headline:    "See exactly where your money stands"
Subhead:     "Link the accounts where your paycheck lands and your
             bills come from. The more you add, the more accurate
             your forecast."

Section header: "Here's what we found"  (when ≥1 pillar detected)
                    OR
Section header: "Your Setup Checklist"  (when 0 pillars beyond bank)

[Card — Accordion 3.0 group, 3 rows:]
  Row 1: Bank connection                     ✓ / →
         "{N} accounts linked"               (expandable to account list)
  Row 2: Paycheck                            ✓ / ⊝ / →
         "{$X} detected {cadence}" OR
         "No income detected"                (expandable to detected income sources)
  Row 3: Recurring bills                     ✓ / ⊝ / →
         "{$X}/mo detected" OR
         "No bills detected"                 (taps into Screen A3 when detected)

Section header: "More ways to improve your cash flow"

[Card — List 3.0, 2 rows:]
  Row 4: ☐ Link another account
         "Add the bank where your rent, cards, or
         everyday spending comes from."
  Row 5: ☐ Set up direct deposit  [Recommended badge — Teal-100 chip]
         "Bring your paycheck to RoarMoney to unlock
         instant deposits, fee savings, and your full
         forecast."

Footer microcopy: "You can return here anytime to improve your
                  cashflow forecast or finish the suggested tasks."

[Button 3.0 — Primary, Large, full width: "View my Cashflow"]
```

**MLDS components**
- `Navigation Bar 3.0` (Title + help icon)
- `Accordion 3.0` group for the three pillar rows
- `List 3.0` for the recommendation rows
- `Badge 3.0` (Standard/Success size S) for `Recommended`
- `Button 3.0` (Primary Large)

**Detection states (per pillar row)**

| State | Icon | Right-side affordance | Tap behavior |
|---|---|---|---|
| Detected (Bank, Paycheck) | Filled checkmark, Teal-900 | Chevron down (expand) | Reveals detail list inline |
| Detected (Recurring bills) | Filled checkmark, Teal-900 | Chevron right | Routes to Screen A3 |
| Not detected | Minus circle, Red-300 outline | Chevron right | Routes to dedicated empty-state explainer (out of A scope) |

**Why bills routes to a separate screen:** Bills carry edit affordances (delete, mark not recurring, fix amount) that don't fit inline in an accordion. Bank and paycheck are read-only confirmations.

**Edge cases**
- Loading state on first visit while detection runs — `Progress/Linear` indeterminate at top of card; row labels visible, detail rows skeleton (`Gradient/Skeleton-light`).
- Detection partial-fail (bank ok, paycheck timeout) — row shows `⊝` with subtle "Refresh" affordance.
- User has 1 bank account vs 3 — same component, different row count when expanded. Long lists scroll within the accordion content area, max height 240px before internal scroll.
- User has 0 detected paychecks AND 0 detected bills — section header changes from "Here's what we found" to "Your Setup Checklist." Body still shows pillars; copy below the bank pillar gets warmer ("Keep going to unlock your full forecast").
- User taps `View my Cashflow` with 0 paychecks and 0 bills detected — proceed anyway; dashboard renders with `Partial estimated` confidence tag.

**Copy guidance**
- Pillar status copy is factual, not editorializing. `$1,400 detected bi-weekly` not `Looks like you make about $1,400 every two weeks!`
- The "More ways" section uses verb-led labels (`Link another account`, `Set up direct deposit`) and one-line value prop subtext.
- The footer microcopy is the escape valve — confirms this screen is non-destructive and revisitable. Reduces commitment anxiety.

**Transition out**
- Tap `View my Cashflow` → Dashboard (Phase B). Detection state determines the dashboard hero per D19: `High → Positive STS`, `Partial → Negative STS`, `Building → Building (24h)`, `Low → Low confidence`. In production, High/Partial fork on the actual STS calculation; the prototype uses a stable mapping so reviewers can walk every Overview state to its dashboard counterpart deterministically.
- Tap `Recurring bills` row (when detected) → Screen A3.
- Tap `Recommended: Set up direct deposit` → existing direct deposit setup flow.

---

### Screen A3 — Confirm Recurring Bills (optional side-trip)

**Purpose:** Let users verify, edit, or add to detected recurring bills. Optional, not blocking. Dashboard does not require this step.

**Layout (light mode, 390px):**

```
[Status bar]
[Navigation Bar 3.0 — back arrow, "Cash Flow", help]

Headline:    "Your upcoming bills"
Subhead:     "Your recurring bills shape how much you actually
             have to work with each month."

Section header: "We found these"

[Card — List 3.0, read-only:]
  • National Grid          $24.00    Due Oct 14
  • T-Mobile               $40.00    Due Oct 18
  • Spotify Premium        $13.00    Due Oct 22
  • Rent                   $1,200.00 Due Nov 1

[Inline prompt: "Anything we missed?"]
Subtext: "Browse your recent transactions and tap + to add any
         recurring bills we missed."
[Link 3.0 — "Browse transactions"]

[Button 3.0 — Primary, Large, full width: "Confirm your bills"]
```

**Read-only commitment:** Bill rows do not support edit, delete, or amount changes in Phase 1. The user's only modification path is "add a bill from a detected transaction." This preserves the no-manual-entry commitment in `phases.md` — users cannot type anything, only confirm patterns we've already detected.

**MLDS components**
- `Navigation Bar 3.0`
- `List 3.0` (with merchant logo, label, amount, due date — display only, no trailing affordance)
- `Link 3.0` (Standard, Medium) for "Browse transactions"
- `Button 3.0` (Primary Large)

**States**
- Default (bills detected)
- Empty / not-yet-detected (e.g., user just linked, detection still running) — section replaces "We found these" with `Building your view` chip and copy: "We're still tracking your transactions. This usually takes up to a day after linking." Browse transactions link is hidden in this state since transactions aren't surfaced yet either.
- Loading (skeleton rows on first paint)

**Edge cases**
- Long bill list (>8) — scrollable within section, sticky CTA at bottom.
- User taps `Browse transactions` → routes to Screen A3.1 (transaction picker, defined below).
- User wants to remove a bill — **not supported in Phase 1.** Bills can only be added via picker. Mis-detected bills are a known Phase 2 fix. Worth instrumenting in research.

**Copy guidance**
- "We found these" preserves the transparency framing from Overview.
- The subhead frames *why* bills matter — they reduce safe-to-spend — without naming the dashboard term yet.
- Confirmation CTA names the action: `Confirm your bills`, not `Done` or `Save`.

**Transition out**
- Tap `Confirm your bills` → return to Overview, which now shows ✓ on the Recurring bills row with updated total.
- Or tap back arrow → return to Overview without confirmation (no data lost; bills remain as detected).

---

### Screen A3.1 — Transaction picker (sub-screen of A3)

**Purpose:** Let users mark recurring bills we missed by selecting from their detected transaction history. The only path to "add a bill" in Phase 1. Preserves the no-manual-entry commitment.

**Layout (light mode, 390px):**

```
[Status bar]
[Navigation Bar 3.0 — back arrow, "Add a bill", help]

Headline:    "Tap any recurring charge"
Subhead:     "We pulled your last 30 days of transactions. Add
             anything that hits regularly."

[Section — grouped by date, most recent first]

  This week
  • Spotify Premium        $13.00    Apr 24    [+]
  • Starbucks              $6.50     Apr 23    [+]
  • Mcdonalds              $14.20    Apr 22    [+]

  Last week
  • National Grid          $24.00    Apr 18    [+]
  • Whole Foods            $87.30    Apr 16    [+]
  ...

[Footer — sticky]
"Don't see it? Recurring bills can take up to a day to appear
 after linking your account."
```

**MLDS components**
- `Navigation Bar 3.0` (back arrow, title, help)
- `List 3.0` rows grouped by date sections
- `Button 3.0` (Small, Icon-only `+` for the trailing add affordance, 30x30px)
- `Sticky Note 3.0` for the "added" toast (5-second undo)

**States**
- Default (transactions detected)
- Empty / detection still running — replaces transaction list with full-card empty state: `Building your view` chip + copy "We're still pulling in your transactions. This usually takes up to a day after linking."
- Loading — skeleton rows
- Bill added — row collapses with checkmark briefly, then disappears from picker (already a confirmed bill); toast "Added to your bills" with Undo
- All recurring detected — empty state: "Looks like you've added everything. We'll keep watching for new patterns."

**Edge cases**
- User taps `+` on a one-off transaction (e.g., Whole Foods) — Phase 1 does not validate; trust the user. If a bill turns out non-recurring, it'll show up in the bills list; Phase 2 will surface a "this didn't recur" prompt.
- User scrolls deep — virtualize after 50 rows; `Building your view` footer stays sticky.

**Copy guidance**
- The picker explicitly does not let users "create" a bill from scratch. Every row is a real transaction. This is the system addition that lets us claim "no manual entry" while still giving users a correction path.
- The footer microcopy sets a 24-hour expectation explicitly. This single line prevents a class of "where's my bill?" support tickets.

**Transition out**
- Tap any `+` → adds the bill to A2's confirmed list, transaction row disappears from picker.
- Tap back arrow → return to A2 with any added bills already reflected in the list (no separate confirm step needed inside the picker).

---

### Confidence tag pattern (system addition)

This pattern is introduced by V2 and should be designed once for reuse across MoneyLion AI-derived surfaces.

**Variants:**

| Tag | When | Visual |
|---|---|---|
| (none) | High confidence — all detection signals strong | No tag |
| `Partial estimated` | Some signals missing or weak after detection has run to completion | Small chip, Teal-100 bg / Teal-900 text, sits next to or below the metric |
| `Building your view` | Detection still running (up to 24 hours after first link) | Same chip shape, Yellow-100 bg / Yellow-700 text |
| `Limited info` | Detection has completed (24h+ since link) but neither paycheck nor bills surfaced | Chip + tappable explainer, neutral colors, points back to Overview recommendations |

**Tap behavior:** All chips are tappable and open a `Dialog 3.0` (Single button) or bottom sheet that explains:
- What's confident
- What's estimated and why
- What the user can do to improve confidence (links back to Overview)

**Rule:** No surface displays a confidence-derived metric without showing its tag (or earning the right to omit it via high confidence).

---

### Phase A risk to validate

**Riskiest assumption:** The `Partial estimated` chip will be read as a transparency signal that builds trust.

**Why it matters:** If users instead read it as "this product is broken / unreliable," we will see lower dashboard engagement among the partial-confidence cohort, which is a meaningful share of new users (anyone whose paycheck or bills haven't been detected yet, or who linked a non-primary bank).

**Cheapest test:** Moderated user research with 6-8 Stretched-segment users on a static Figma flow. Show two versions of the dashboard hero — one with the chip, one without — and probe trust, confidence, and intent to act on dashboard suggestions. Run before any production build.

**If the test fails:** We rework the chip from disclaimer to call-to-action. Instead of `Partial estimated` → `Add your paycheck` (active), tied to the missing pillar specifically.

---

## Phase B — Dashboard composition

> **Pending ideation working session. Will be appended once we converge on hero, primary metric, and section stack.**

Open questions to resolve:
- [ ] Hero treatment: dark surface vs light, chart-as-hero vs metric-as-hero
- [ ] Primary metric: Safe to Spend, days-of-runway, end-of-month forecast, paycheck-cycle balance
- [ ] Section stack: what lives below the hero, in what order
- [ ] Smart Actions surfacing rules
- [ ] Confidence tag application on dashboard data
- [ ] Activity timeline: in or out of Phase 1
- [ ] Empty / low-confidence dashboard treatment

Working doc: `dashboard-exploration.md` (created at start of Phase B session)

---

## Changelog

| Date | Change |
|---|---|
| Apr 2026 | Phase A drafted: A0 linking gate, A1 Overview, A2 Confirm bills, confidence tag pattern, risk to validate. Phase B placeholder. |
| Apr 2026 | Bill confirm made read-only (no edit/delete). Added transaction picker as the sole bill-add path. Updated `Building your view` to reflect up-to-24h detection window. Added detection timing implications to entry section. Sharpened direct deposit copy on Overview. |
| Apr 2026 | Added Splash carousel (A0) as new entry screen for first-timers. Renumbered: linking gate A0 → A1, Overview A1 → A2, bill confirm A2 → A3, picker A2.1 → A3.1. Linking gate purpose narrowed (splash now sells the value prop). Removed push-notification consideration — silent dashboard update on detection completion is the Phase 1 commitment. |
| Apr 2026 | Splash CTA persistent across all pages — carousel is enrichment, not a gate. Page 1 must stand on its own. Final-page link-state branching removed; routing handled by entry decision tree post-tap. |
| Apr 28 2026 | Splash CTA copy is link-state aware (overrides the previous "stays as Continue" rule). Unlinked users see `Link your bank` + trust microcopy underneath. Routes them through A1 Linking gate, which on success lands on A2 in `Building your view` state. Linked users still see `Continue` and route directly to A2. Trade-off documented in A0 States section. Wired in `CashFlowV2Draft.canvas.tsx` with a `linked` flag in the demo state and a 1.5s auto-progress from the gate's loading state. |
| Apr 28 2026 | A2 Overview → Dashboard routing made deterministic per build-phases D19. High → Positive, Partial → Negative, Building → Building, Low → Low. A2 Transition-out section spells out the mapping for production vs. prototype. |
