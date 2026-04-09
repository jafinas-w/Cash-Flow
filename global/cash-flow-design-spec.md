# Cash Flow — Design Specification v1

> **Status:** Draft — built on best-judgment assumptions for all 13 open decisions
> **Owner:** Jaf Inas / PFM Team
> **Last updated:** April 2026

This document covers the full Cash Flow feature: flow architecture, screen-by-screen specifications, copy, states, and MLDS component mapping. It is built on 13 design assumptions stated below. Any assumption that gets revised invalidates the affected screens (flagged per screen).

---

## Design Assumptions

Each assumption corresponds to an open decision from the pre-design stack.

| # | Decision | Assumption | If Revised, Invalidates |
|---|---|---|---|
| 1 | STS formula | `Current balance - committed upcoming expenses = STS` for linked users. `Entered income - entered bills = STS` for manual. "Committed" means recurring bills, subscriptions, and scheduled transfers detected in transaction history. Estimated discretionary spend (groceries, gas) shown separately as "typical spending" context, not subtracted from STS. | Hub hero, Explainer |
| 2 | Tier structure | Single progressively enhanced experience. One UI shell. Linked users see more data (real-time balance, spending pace, detected bills). Manual users see a simpler version of the same layout. | All screens |
| 3 | Minimum viable data | **Linked:** Balance + at least 1 detected pay cycle. **Manual:** Income amount + frequency + next payday. Below threshold, show setup prompt instead of a number. | First-time, Incomplete state |
| 4 | Legal framing | STS is labeled "Estimated" with an as-of timestamp. A "How this works" explainer is always accessible. No guarantee language. Disclaimer: "This is an estimate, not financial advice." | Hub hero, Explainer, all copy |
| 5 | Instacash copy | Use "Get covered" / "bridge the gap" / "stay on track" framing. Never "borrow," "loan," "lend." Nudge includes visible rationale. Always dismissable. | Instacash bridge card |
| 6 | Data consent | Existing account-linking consent is sufficient for Cash Flow. Add a "What we use" transparency link in Settings. No additional consent screen. | Setup flow |
| 7 | Confidence display | MVP shows a single "Estimated" badge on the STS number. Linked users with 2+ full pay cycles of clean data lose the "Estimated" label automatically. | Hub hero |
| 8 | Timestamp display | Always visible below the STS number. "Updated [time]" for linked users, "Based on what you entered" for manual users. | Hub hero |
| 9 | Instacash trigger | Threshold-based for MVP. Trigger when STS drops below 10% of user's typical pay-cycle income. Nudge card appears in the "For You" section, not above the hero. | Hub states, Instacash card |
| 10 | Irregular income | MVP does not model variable income. Users with irregular deposits are prompted to set income manually. Fallback text: "We couldn't detect a regular paycheck. Enter your expected income to get started." | Setup flow, Hub |
| 11 | Navigation placement | Cash Flow is a card on the Home tab (entry point) that opens into a dedicated full-screen hub. Not a separate bottom nav tab. | Home card, Hub |
| 12 | Plan tab relationship | Cash Flow (See pillar) coexists with Plan tab. Cash Flow = "What's available now." Plan = longer-term goals. No duplication. Smart Moves cards can appear contextually inside the Cash Flow hub's "For You" section. | Hub "For You" section |
| 13 | Brand refresh | Design in MLDS 4.0 as-is. Modular enough to re-skin. No speculative new-brand patterns. | All visual specs |

---

## Flow Architecture

### Entry Points

```
Home Tab
  +-- Cash Flow Card (STS at a glance)
       +-- tap --> Cash Flow Hub

Push Notification (conditional)
  +-- "Your Safe to Spend dropped below $50"
       +-- tap --> Cash Flow Hub (short state)
```

### Screen Map

```
Cash Flow Hub (main screen)
  |-- Hero area (dark surface)
  |    +-- "How this works" --> STS Explainer (bottom sheet)
  |-- Coming Up section
  |    +-- "See all" --> Full Bills List (push screen)
  |-- Spending Pace section (linked users only)
  |-- For You section (contextual cards)
  |    |-- Instacash Bridge Card (conditional: STS < threshold)
  |    +-- Smart Action cards (e.g., bill negotiation, savings)
  +-- Settings (gear icon in nav bar)
       |-- Pay cycle
       |-- Manual adjustments (add/remove bills)
       |-- Linked accounts
       |-- Notifications
       +-- What data we use

First-Time Flow (no data yet)
  +-- Cash Flow Card (empty state) --> Setup Intro
       |-- "Link your bank" --> Account linking flow --> Hub
       +-- "Enter manually" --> Manual Input (3 steps) --> Hub
```

---

## Screen Specifications

---

### Screen 1: Home Card

**Purpose:** At-a-glance STS on the Home tab. Single tap target to enter the Cash Flow Hub.

**MLDS Component:** Carousel Banner Card 3.0 (343x170px), light mode, bg-secondary (#FFFFFF)

**Layout:**

```
+-------------------------------------+
|  Cash Flow                       >  |  Label Lg (14px/600), text-primary
|                                     |
|  $342                               |  Headline Md (mobile: 24px/600), text-primary
|  Safe to Spend                      |  Body Md (14px/400), text-secondary
|                                     |
|  You're ahead . 6 days to payday    |  Body Sm (12px/400), color-positive
|                                     |
+-------------------------------------+
```

**State Variants:**

| State | Status line | Status color |
|---|---|---|
| Ahead (STS > 20% of income) | "You're ahead . [N] days to payday" | Teal-900 (#006657) |
| Tight (STS 5-20%) | "Budget's tight . [N] days to payday" | Yellow-700 (#B89F00) |
| Short (STS < 5%) | "You may come up short . [N] days to payday" | Red-600 (#CE293F) |
| First use (no data) | "See what you can safely spend" | text-secondary |
| Stale (> 4 hrs) | "Tap to refresh your number" | text-tertiary |
| Loading | Skeleton: number placeholder + two text lines | -- |
| Error | "Couldn't load your cash flow. Tap to retry." | text-tertiary |

**Interaction:**
- Tap anywhere on card --> push to Cash Flow Hub
- First-use tap --> push to Setup Intro (Screen 6)

**Assumptions used:** #1, #2, #7, #8, #11

---

### Screen 2: Cash Flow Hub

**Purpose:** The core experience. Answers: "How much can I spend before my next paycheck?"

**Structure:** Dark hero surface (top) + light scrollable content (bottom).
**Scroll depth target:** ~1.5 viewport heights max (per known constraint).

---

#### 2A. Hero Area (dark surface)

**Surface:** bg-alt (#000000). Consistent with established Cashflow ring hero pattern.

**MLDS Components:** Navigation Bar 3.0 (dark variant), Chips 3.0

```
+-------------------------------------+
| <  Cash Flow                   [gear]|  Navigation Bar 3.0 (375x56px)
|----- dark surface (#000000) --------|
|                                     |
|          You're Ahead               |  Title Sm (16px/600), Teal-500
|                                     |
|            ,------,                 |
|           /        \                |  Donut ring, 160x160px
|          |   $342   |              |  Display Sm (mobile: 28px/600), #FFFFFF
|          |  safe to  |              |  Body Sm (12px/400), text-secondary-ALT
|          |   spend   |              |
|           \        /                |
|            '------'                 |
|                                     |
|     Estimated . Updated 5 min ago   |  Body Sm (12px/400), text-tertiary-ALT
|                                     |
|   6 days until your Apr 15 payday   |  Body Md (14px/400), text-secondary-ALT
|                                     |
|  [. $342 Safe] [. $458 Bills]       |  Chips 3.0 (compact, dark variant)
|            [. $234 Spent]           |
|                                     |
+----- transition to light -----------+
```

**Ring Specification:**

| Segment | Represents | Color | Linked | Manual |
|---|---|---|---|---|
| Safe to Spend | Money available | Teal-600 (#00E5C4) | Yes | Yes |
| Committed | Upcoming bills | Neutral-700 (#505050) | Yes | Yes |
| Already Spent | Discretionary spending this cycle | Neutral-800 (#333333) | Yes | No |

Ring is 160x160px, 12px stroke width, rounded end caps. STS amount is centered vertically inside the ring in Display Sm. "safe to spend" label sits directly below the number inside the ring in Body Sm.

**Ring interaction:** Tap on ring triggers a brief pulse animation (150ms scale to 1.02x, ease-out) and smooth-scrolls to the Coming Up section.

**"Estimated" badge:**
- Visible for all manual users
- Visible for linked users until 2+ full pay cycles of clean data are observed
- Disappears automatically once confidence threshold is met (Assumption #7)
- Format: inline text before the timestamp, separated by a dot

---

#### 2B. Content Area (light surface)

**Surface:** bg-primary (#F6F6F6)

```
|----- light surface (#F6F6F6) ------|
|                                     |
|  How your number is calculated >    |  Link 3.0 (Size M, Standard, appending icon)
|                                     |
|  Coming Up                          |  Title Lg (20px/600), text-primary
|                                     |
|  +- bg-secondary card (#FFF) ------+|
|  |  [red]  Netflix      Apr 12  $15 ||  List 3.0 row (52px)
|  |----------------------------------||
|  |  [yel]  Electric     Apr 14  $89 ||  List 3.0 row
|  |----------------------------------||
|  |  [gry]  Car ins.     Apr 14 $154 ||  List 3.0 row
|  |----------------------------------||
|  |  See all 8 bills >               ||  Link 3.0 (Size S, inside card)
|  +----------------------------------+|
|                                     |
|  Your Spending Pace                 |  Title Lg (20px/600)
|  [Linked users only]               |
|  +- bg-secondary card (#FFF) ------+|
|  |  You've spent $234 so far.       ||  Body Lg (16px/400)
|  |  That's about typical for this   ||
|  |  point in your pay cycle.        ||
|  |                                  ||
|  |  [$234=========|.....$380]       ||  Progress/Linear (342x6px)
|  |   You         Typical by now     ||  Body Sm (12px/400), text-tertiary
|  +----------------------------------+|
|                                     |
|  For You                            |  Title Lg (20px/600)
|  +- Lifecycle Banner 3.0 ----------+|
|  |  [icon] Your Netflix price went  ||  328x68px
|  |   up $3 this month.             ||
|  |   Review your subscriptions >   ||
|  +----------------------------------+|
|                                     |
|  +- Lifecycle Banner 3.0 ----------+|  [Manual users only]
|  |  [icon] Link your bank for a    ||  328x68px
|  |   more accurate picture.        ||
|  |   Connect now >                 ||
|  +----------------------------------+|
|                                     |
+-------------------------------------+
```

---

#### 2C. Coming Up Row Specification

Each bill row uses **List 3.0** (375px width, 52px row height):

| Position | Element | Spec |
|---|---|---|
| Left (12px from edge) | Category icon circle | 32x32px circle, icon 16x16 centered |
| Center | Bill name | Title Sm (16px/600), text-primary |
| Center (below name) | Due date | Body Sm (12px/400), text-secondary |
| Right (12px from edge) | Amount | Title Sm (16px/600), text-primary, right-aligned |

**Icon circle urgency colors:**

| Due in | Circle bg | Icon color |
|---|---|---|
| 1-2 days | Red-100 (#FFEBED) | Red-600 (#CE293F) |
| 3-5 days | Yellow-100 (#FFFCE9) | Yellow-700 (#B89F00) |
| 6+ days | Neutral-200 (#EEEEEE) | text-secondary |

**Confidence badges on bill rows:**

| Source | Badge | MLDS |
|---|---|---|
| Detected, high confidence | No badge | -- |
| Detected, pattern-based | "Est." | Badge 3.0, Size S, Neutral |
| User-entered | "Manual" | Badge 3.0, Size S, Neutral |

---

#### 2D. Hub State Variants

**State: You're Ahead** (STS > 20% of typical pay-cycle income)

| Element | Specification |
|---|---|
| Status label | "You're Ahead" in Teal-500 (#33F6D8) |
| Ring | Large teal segment (dominant), small committed segment |
| Spending Pace | "You've spent $234 so far. That's about typical for this point in your pay cycle." |
| Instacash card | Hidden |
| For You | Savings suggestions, subscription optimization, Smart Actions |

**State: Budget's Tight** (STS 5-20% of income)

| Element | Specification |
|---|---|
| Status label | "Budget's Tight" in Yellow-400 (#FFED79) |
| Ring | Smaller teal segment, larger committed + spent segments |
| Spending Pace | "You've spent $310 so far. That's a bit more than usual. Keep an eye on it." |
| Instacash card | Hidden |
| For You | Tips to stretch remaining balance, spending awareness nudges |

**State: You May Come Up Short** (STS < 5% of income)

| Element | Specification |
|---|---|
| Status label | "You May Come Up Short" in Red-400 (#FF7083) |
| Ring | Minimal or no teal segment. Committed + spent dominate |
| Spending Pace | "You've spent $420 so far. That's more than usual. You have [N] days until payday." |
| Instacash card | Visible, first card in For You section |
| For You | Instacash bridge + practical reduction tips |

**State: Stale Data** (> 4 hours since last bank sync)

| Element | Specification |
|---|---|
| Banner | Banners 3.0, Warning variant (4). Positioned ABOVE the hero area (per constraint: urgent alerts surface above hero, not inline) |
| Copy | "Your info hasn't updated since [time]. Pull down to refresh." |
| Hub content | Shows last known data, no changes |

**State: Connection Error** (bank link unreachable)

| Element | Specification |
|---|---|
| Banner | Banners 3.0, Negative variant (3). Above hero |
| Copy | "We can't reach your bank right now. Your number may not be current." |
| CTA | "Try again" (Button 3.0 Secondary, inside banner) |

**State: Loading** (initial fetch or pull-to-refresh)

| Element | Specification |
|---|---|
| Hero | Skeleton ring outline (160x160px circle, 12px stroke, Neutral-800), number placeholder, two text-line placeholders |
| Coming Up | 3 skeleton rows (52px each, shimmer gradient per MLDS) |
| Spending Pace | Skeleton bar + 2 text placeholders |

**Assumptions used:** #1, #2, #4, #7, #8, #9, #12, #13

---

### Screen 3: STS Explainer (Bottom Sheet)

**Purpose:** Show how the number is built. Addresses transparency risks and classification error concerns.

**Trigger:** Tap "How your number is calculated" on the Hub.

**MLDS Component:** Bottom Sheet. Not extracted from MLDS reference. `[System addition]` -- falls back to full push screen if bottom sheet is unavailable in current library.

---

#### 3A. Linked User Variant

```
+-------------------------------------+
|  --- (sheet handle, 32x4px) ---     |
|                                     |
|  How Safe to Spend works            |  Headline Sm (mobile: 24px/600)
|                                     |
|  Your Safe to Spend is how much     |  Body Lg (16px/400), text-secondary
|  you can spend before your next     |
|  payday without falling behind      |
|  on bills.                          |
|                                     |
|  +- bg-secondary card (#FFF) ------+|
|  |  Your balance       $1,034.00   ||  List 3.0 row, text-primary
|  |----------------------------------||
|  |  - Upcoming bills    -$458.00   ||  List 3.0 row, Red-600 amount
|  |----------------------------------||
|  |  - Typical spending  -$234.00   ||  List 3.0 row, text-secondary amount
|  |    Based on your usual pace     ||  Body Sm, text-tertiary (indented 16px)
|  |----------------------------------||
|  |  = Safe to Spend      $342.00   ||  List 3.0 row, Teal-900 amount, bold
|  +----------------------------------+|
|                                     |
|  [i] This is an estimate based on   |  Body Md (14px/400), text-secondary
|  your linked account and bills      |
|  we've detected. It updates as      |
|  new transactions come in.          |
|                                     |
|  Some things we can't see:          |  Body Md, text-secondary
|  . Cash payments or checks          |
|  . Bills paid from other accounts   |
|  . Shared or split expenses         |
|                                     |
|  Something look wrong?              |  Body Md, text-secondary
|  Adjust your bills and income >     |  Link 3.0 --> Settings
|                                     |
|  Last updated: 9:41 AM today        |  Body Sm (12px/400), text-tertiary
|                                     |
|  [ Got it ]                         |  Button 3.0 Primary, Large (311x48px)
|                                     |
+-------------------------------------+
```

---

#### 3B. Manual User Variant

The formula card changes:

```
|  +- bg-secondary card (#FFF) ------+|
|  |  Your income        $2,400.00   ||  List 3.0 row
|  |    Biweekly                     ||  Body Sm, text-tertiary
|  |----------------------------------||
|  |  - Your bills        -$458.00   ||  List 3.0 row
|  |    8 bills entered              ||  Body Sm, text-tertiary
|  |----------------------------------||
|  |  = Safe to Spend    $1,942.00   ||  List 3.0 row, Teal-900, bold
|  +----------------------------------+|
|                                     |
|  [i] This is based on what you've   |
|  entered. For a more accurate       |
|  picture, link your bank account.   |
|                                     |
|  Link your bank >                   |  Link 3.0
```

Note: No "typical spending" line for manual users (no transaction data to derive it).

**Assumptions used:** #1, #4, #6

---

### Screen 4: Full Bills List

**Purpose:** Complete view of all upcoming obligations in the current pay cycle.

**Trigger:** Tap "See all [N] bills" from the Hub.

**MLDS Components:** Navigation Bar 3.0, List 3.0

```
+-------------------------------------+
| <  Upcoming Bills                   |  Navigation Bar 3.0
|----- bg-primary (#F6F6F6) ----------|
|                                     |
|  Before your Apr 15 payday          |  Body Lg (16px/400), text-secondary
|  8 bills . $458 total               |  Body Md (14px/400), text-tertiary
|                                     |
|  +- bg-secondary card (#FFF) ------+|
|  |  [red] Netflix       Apr 12  $15||  List 3.0 (52px row)
|  |----------------------------------||
|  |  [red] Spotify       Apr 12  $10||
|  |----------------------------------||
|  |  [yel] Electric      Apr 14  $89||
|  |----------------------------------||
|  |  [yel] Car insurance Apr 14 $154||
|  |----------------------------------||
|  |  [gry] Rent  [Est.]  Apr 15$1200||  Badge 3.0 S Neutral on estimated
|  |----------------------------------||
|  |  [gry] Phone bill    Apr 15  $85||
|  |----------------------------------||
|  |  [gry] Gym           Apr 15  $45||
|  |----------------------------------||
|  |  [gry] iCloud        Apr 15   $3||
|  +----------------------------------+|
|                                     |
|  Something missing?                 |  Body Md, text-secondary
|  Add a bill manually >             |  Link 3.0 --> add bill flow
|                                     |
+-------------------------------------+
```

**Row interaction:** Tap on a bill row expands inline using **Accordion 3.0** pattern:

```
|  [red] Netflix       Apr 12  $15  [v]|
|  +----- expanded content -----------+|
|  |  Last paid: Mar 12, $15.49       ||  Body Md, text-secondary
|  |  Frequency: Monthly              ||
|  |  Detected from your account      ||  Body Sm, text-tertiary
|  |                                  ||
|  |  Edit >    Remove >              ||  Link 3.0 (Size S) x2
|  +----------------------------------+|
```

**Assumptions used:** #1, #3

---

### Screen 5: Instacash Bridge Card

**Purpose:** Contextual surface when user may not make it to payday. Must not feel like a sales pitch.

**Trigger:** STS drops below 10% of typical pay-cycle income (Assumption #9).

**Placement:** First card in the "For You" section. Not above the hero. Rationale: this is an offer, not an alert. Placing it above the hero (where system warnings go) would feel predatory, violating the trust principle from the risks doc.

**MLDS Component:** Banners 3.0, Standard variant (0). Not Negative -- avoids amplifying financial stress visually.

```
+-------------------------------------+
|                                     |
|  Get covered before payday          |  Title Sm (16px/600), text-primary
|                                     |
|  You have $23 until your Apr 15     |  Body Lg (16px/400), text-secondary
|  payday. Instacash can spot you     |
|  up to $250 so you stay on track.   |
|                                     |
|  [See my options]     [Not now]     |  Button Group: Primary (M) + Transparent (M)
|                                     |
|  Why am I seeing this? >            |  Link 3.0 (Size S), text-tertiary
|                                     |
+-------------------------------------+
```

**"Why am I seeing this?" expansion:**

Inline text reveal (200ms, ease-out):
"Your Safe to Spend is lower than usual this close to payday. Instacash is one way to bridge the gap if you need it."

**Copy rules (Assumption #5):**

| Permitted | Prohibited |
|---|---|
| "Get covered" | "Borrow" |
| "Spot you" | "Loan" |
| "Bridge the gap" | "Lend" |
| "Stay on track" | "Credit" |
| "Access up to" | "Advance" (unless pre-approved by legal) |

**Dismissal behavior:**
- "Not now" dismisses the card for the current session
- Card reappears next session if STS is still below threshold
- After 3 dismissals in a single pay cycle, suppress until the next cycle
- Dismissal count resets on each new pay cycle

**CTA behavior:**
- "See my options" --> navigate to existing Instacash flow (external to this feature)
- Pass context: user's current STS amount and days until payday, so Instacash can personalize the offer

**Assumptions used:** #5, #9

---

### Screen 6: First-Time Setup

**Purpose:** Onboard users into Cash Flow. Offer two paths: link bank or enter manually.

**Trigger:** User taps the empty-state Home Card.

**MLDS Components:** Navigation Bar 3.0, Button Group 3.0 (Stacked, 343x104px)

```
+-------------------------------------+
| <  Cash Flow                        |  Navigation Bar 3.0
|----- bg-primary (#F6F6F6) ----------|
|                                     |
|                                     |
|         [Illustration]              |  160x160px centered
|         (financial clarity          |
|          motif, not a piggy         |
|          bank -- see note below)    |
|                                     |
|  Know what you can                  |  Headline Sm (mobile: 24px/600)
|  safely spend                       |  centered
|                                     |
|  See how much is actually yours     |  Body Lg (16px/400), text-secondary
|  to spend before your next          |  centered, max-width 300px
|  payday, after bills and            |
|  commitments.                       |
|                                     |
|                                     |
|                                     |
|  [ Link your bank ]                 |  Button 3.0 Primary, Large (311x48px)
|                                     |  8px gap
|  [ Enter manually ]                 |  Button 3.0 Secondary, Large (311x48px)
|                                     |
|  Your data is used only to          |  Body Sm (12px/400), text-tertiary
|  calculate your number.             |  centered
|  Learn more >                       |  Link 3.0 (Size S)
|                                     |
+-------------------------------------+
```

**Copy rationale:**
- "Know what you can safely spend" -- directly answers the user's core question. No abstraction.
- "See how much is actually yours" -- "actually" positions STS as truth-telling vs. a raw balance.
- "Your data is used only to calculate your number" -- preempts the #1 privacy concern at linking time. Per risks doc, consent and explainability matter here.
- No accuracy promises ("real-time," "always up to date") -- per risks doc, over-promising at onboarding is a top risk.

**Illustration note:** Avoid piggy bank (savings connotation, not cash flow). Suggest: a simple forward-looking visual, e.g., a calendar with a paycheck icon, or an abstract "clarity" motif. Illustration style should follow MLDS contextual illustration palette (Light-blue #91EBF7, Medium-teal #16ABAB, Coral #FFA093).

**Path A: "Link your bank"** --> existing account linking flow (external). On completion, return to Cash Flow Hub with linked data.

**Path B: "Enter manually"** --> Manual Input Flow (Screen 7).

**Assumptions used:** #2, #3, #6

---

### Screen 7: Manual Input Flow (3 Steps)

**Purpose:** Collect minimum data to show a basic STS for users who don't link a bank.

**Structure:** 3-step linear flow with progress indicator.

---

#### Step 1: Income

**MLDS Components:** Progress/Linear (Steps variant, 3 steps), Input 3.0 (prepend icon)

```
+-------------------------------------+
| <  Set up Cash Flow                 |  Navigation Bar 3.0
|  [Step 1===Step 2---Step 3]         |  Progress/Linear Steps (342x6px)
|----- bg-primary (#F6F6F6) ----------|
|                                     |
|  How much do you take               |  Headline Sm (mobile: 24px/600)
|  home each paycheck?                |
|                                     |
|  Enter your after-tax amount.       |  Body Lg (16px/400), text-secondary
|                                     |
|  +- Input 3.0 (343x80px) ----------+|
|  |  Paycheck amount                 ||  Label (above input)
|  |  $ |                             ||  Prepend icon variant, numeric keyboard
|  |  After taxes and deductions      ||  Helper text
|  +----------------------------------+|
|                                     |
|                                     |
|                                     |
|  [ Continue ]                       |  Button 3.0 Primary, Large (311x48px)
|                                     |  Disabled state until amount > 0
+-------------------------------------+
```

**Validation:**
- Minimum: $1
- Maximum: $99,999
- Format: Whole dollars (no cents for MVP -- avoids false precision per risks doc)
- Error state (Input 3.0 Error variant): "Enter an amount between $1 and $99,999"

---

#### Step 2: Pay Frequency + Next Payday

```
+-------------------------------------+
| <  Set up Cash Flow                 |  Navigation Bar 3.0
|  [Step 1===Step 2===Step 3]         |  Progress/Linear Steps, step 2 active
|----- bg-primary (#F6F6F6) ----------|
|                                     |
|  How often do you get paid?         |  Headline Sm (24px/600)
|                                     |
|  [Every week]  [Every 2 weeks]      |  Chips 3.0, single-select
|  [Twice a month]  [Monthly]         |  4 chips, horizontal wrap
|                                     |
|                                     |
|  When is your next payday?          |  Title Lg (20px/600)
|                                     |
|  +- Calendar 3.0 ------------------+|
|  |  [Date picker, current month]   ||  343px width, ~322px height
|  +----------------------------------+|
|                                     |
|  [ Continue ]                       |  Button 3.0 Primary, Large
|                                     |  Disabled until both frequency
|                                     |  and date selected
+-------------------------------------+
```

**Validation:**
- Next payday must be today or in the future
- If past date selected: inline error below calendar "Pick a date that's today or later"
- Frequency chips: exactly one must be selected

---

#### Step 3: Bills

```
+-------------------------------------+
| <  Set up Cash Flow                 |  Navigation Bar 3.0
|  [Step 1===Step 2===Step 3]         |  Progress/Linear Steps, step 3 active
|----- bg-primary (#F6F6F6) ----------|
|                                     |
|  Add your regular bills             |  Headline Sm (24px/600)
|                                     |
|  Include rent, utilities, subs,     |  Body Lg (16px/400), text-secondary
|  and anything you pay regularly.    |
|                                     |
|  +- bg-secondary card (#FFF) ------+|  [Shows added bills]
|  |  [house] Rent        $1,200 /mo ||  List 3.0 row + edit icon (16px)
|  |----------------------------------||
|  |  [bolt]  Electric      $89 /mo  ||  List 3.0 row + edit icon
|  +----------------------------------+|
|                                     |
|  + Add another bill                 |  Link 3.0 (leading + icon)
|                                     |
|  --- Add bill form (inline) --------|  [Appears on tap]
|  +----------------------------------+|
|  |  Bill name      [             ] ||  Input 3.0 (343x80px)
|  |  Amount          [$ |          ] ||  Input 3.0 (prepend, currency)
|  |  How often       [Monthly    v ] ||  Dropdown 3.0
|  |  Due date (day)  [15th       v ] ||  Dropdown 3.0
|  |                                  ||
|  |  [ Add ]          [ Cancel ]     ||  Button Group (side by side, M size)
|  +----------------------------------+|
|                                     |
|  You can always add more later      |  Body Sm (12px/400), text-tertiary
|  from your Cash Flow settings.      |
|                                     |
|  [ See my Safe to Spend ]           |  Button 3.0 Primary, Large (311x48px)
|                                     |  Active with 0+ bills (bills optional)
+-------------------------------------+
```

**Why bills are optional at setup:**
Requiring bills blocks users who want to see the feature first. Income + frequency is the true minimum viable data (Assumption #3). Users can add bills later from Settings or from the Hub's "Something missing?" prompt on the Full Bills List.

**Completion transition:**
"See my Safe to Spend" --> push to Cash Flow Hub. Brief celebration: ring animates from 0 to calculated segments (300ms, ease-out) as the STS number counts up from $0 to final value. This is the peak moment per peak-end rule.

**Assumptions used:** #2, #3, #10

---

### Screen 8: Settings

**Purpose:** Manage Cash Flow inputs, connections, and preferences.

**Trigger:** Gear icon on the Hub navigation bar.

**MLDS Components:** Navigation Bar 3.0, List 3.0, Switch 3.0

```
+-------------------------------------+
| <  Cash Flow Settings               |  Navigation Bar 3.0
|----- bg-primary (#F6F6F6) ----------|
|                                     |
|  Pay Cycle                          |  Title Lg (20px/600)
|  +- bg-secondary card (#FFF) ------+|
|  |  Paycheck amount       $2,400 > ||  List 3.0 (tap to edit)
|  |----------------------------------||
|  |  Frequency       Every 2 wks > ||  List 3.0 (tap to edit)
|  |----------------------------------||
|  |  Next payday         Apr 15  > ||  List 3.0 (tap to edit)
|  +----------------------------------+|
|                                     |
|  Bills & Expenses                   |  Title Lg (20px/600)
|  +- bg-secondary card (#FFF) ------+|
|  |  Managed bills              8 > ||  List 3.0 --> Full Bills editor
|  |----------------------------------||
|  |  + Add a bill                   ||  List 3.0 (accent style)
|  +----------------------------------+|
|                                     |
|  Linked Accounts                    |  Title Lg (20px/600)
|  +- bg-secondary card (#FFF) ------+|
|  |  Chase ****4521    Connected  [check] ||  List 3.0, Teal-900 check
|  |----------------------------------||
|  |  + Link another account         ||  List 3.0 (accent style)
|  +----------------------------------+|
|                                     |
|  Notifications                      |  Title Lg (20px/600)
|  +- bg-secondary card (#FFF) ------+|
|  |  Safe to Spend alerts    [ON]   ||  List 3.0 + Switch 3.0 (48x48px)
|  |----------------------------------||
|  |  Bill reminders          [ON]   ||  List 3.0 + Switch 3.0
|  +----------------------------------+|
|                                     |
|  What data we use >                 |  Link 3.0 (Size M)
|                                     |
|  Explains what data Cash Flow uses  |  Body Sm (12px/400), text-tertiary
|  and how your privacy is protected. |
|                                     |
+-------------------------------------+
```

**Edit interactions:**
- Tap on "Paycheck amount" --> Input 3.0 inline edit (same pattern as Step 1)
- Tap on "Frequency" --> Chips 3.0 selector (same as Step 2)
- Tap on "Next payday" --> Calendar 3.0 date picker
- Tap on "Managed bills" --> push to Full Bills List (Screen 4) in edit mode

**Assumptions used:** #6, #8, #10

---

## Complete State Matrix

| Screen | Default | Loading | Empty | Error | Stale | Ahead | Tight | Short |
|---|---|---|---|---|---|---|---|---|
| **Home Card** | STS + status | Skeleton | "See what you can safely spend" | "Couldn't load. Tap to retry." | Dimmed number + "Tap to refresh" | Teal status | Yellow status | Red status |
| **Hub Hero** | Ring + number | Skeleton ring + placeholders | --> Setup Intro | Banner above hero (Negative) | Banner above hero (Warning) | Teal ring/label | Yellow label, ring shift | Red label, min teal |
| **Coming Up** | Top 3 bills | 3 skeleton rows | "No bills detected. Add one?" | Inline error row | Shows last known | Same | Same | Same |
| **Spending Pace** | Progress bar + copy | Skeleton bar | Hidden (manual) | Hidden + error note | "As of [time]" label | "About typical" | "A bit more than usual" | "More than usual" |
| **For You** | Smart Action cards | Hidden during load | Link CTA (manual) | Hidden | Hidden | Savings/optimization | Spending tips | Instacash bridge |
| **Explainer** | Formula breakdown | -- | -- | "Can't load details" | Shows last known + note | Same formula | Same formula | Same formula |
| **Bills List** | Full list | Skeleton rows | "No bills yet" + add CTA | "Couldn't load. Try again." | Shows last known | Same | Same | Same |
| **Instacash Card** | Bridge CTA | -- | -- | -- | -- | Hidden | Hidden | Visible |

---

## Copy Reference

### Status Labels (Hub Hero, Dark Surface)

| State | Label | Color |
|---|---|---|
| Ahead | "You're Ahead" | Teal-500 (#33F6D8) |
| Tight | "Budget's Tight" | Yellow-400 (#FFED79) |
| Short | "You May Come Up Short" | Red-400 (#FF7083) |

### Status Labels (Home Card, Light Surface)

| State | Label | Color |
|---|---|---|
| Ahead | "You're ahead" | Teal-900 (#006657) |
| Tight | "Budget's tight" | Yellow-700 (#B89F00) |
| Short | "You may come up short" | Red-600 (#CE293F) |

Note: Home Card uses sentence case. Hub Hero uses title case for visual weight on dark surface.

### Timestamps

| Context | Format | Example |
|---|---|---|
| Linked, just now (< 1 min) | "Just updated" | "Estimated . Just updated" |
| Linked, recent (1-59 min) | "Updated [N] min ago" | "Estimated . Updated 5 min ago" |
| Linked, older (1-4 hr) | "Updated [N] hr ago" | "Estimated . Updated 2 hr ago" |
| Linked, stale (> 4 hr) | Warning banner above hero | "Your info hasn't updated since 6:15 AM. Pull down to refresh." |
| Manual | Static | "Based on what you entered" |

### Spending Pace Copy

| Pace vs. Typical | Copy |
|---|---|
| Below typical (< 80%) | "You've spent $[X] so far. That's less than usual for this point in your pay cycle." |
| About typical (80-110%) | "You've spent $[X] so far. That's about typical for this point in your pay cycle." |
| Above typical (110-130%) | "You've spent $[X] so far. That's a bit more than usual. Keep an eye on it." |
| Well above (> 130%) | "You've spent $[X] so far. That's more than usual. You have [N] days until payday." |

### Error State Copy

| Scenario | Headline | Body | CTA |
|---|---|---|---|
| Bank connection failed | "Can't reach your bank" | "We're having trouble connecting to [Bank Name]. Your number may not be current." | "Try again" |
| No income detected | "We couldn't detect a regular paycheck" | "Enter your expected income to get started." | "Enter income" |
| Feature unavailable | "Cash Flow isn't available right now" | "We're working on it. Check back soon." | "Go to Home" |
| Partial data | "Your picture is incomplete" | "Link more accounts or add bills to make your number more accurate." | "Improve accuracy" |

### Disclaimer Copy

| Location | Copy |
|---|---|
| Explainer sheet footer | "This is an estimate, not financial advice. Actual amounts may differ based on transactions we can't see." |
| Setup screen footer | "Your data is used only to calculate your number. Learn more >" |
| Instacash bridge "Why" | "Your Safe to Spend is lower than usual this close to payday. Instacash is one way to bridge the gap if you need it." |

---

## MLDS Component Map

| Feature Element | MLDS Component | Figma Name | Notes |
|---|---|---|---|
| Home entry card | Carousel Banner Card | `Carousel banner card 3.0` | 343x170px, light mode |
| Hub nav bar | Navigation Bar | `Navigation Bar 3.0` | Dark variant for hero, standard for other screens |
| Hub hero surface | Custom | -- | bg-alt (#000000), existing pattern for Cashflow ring |
| STS ring/donut | Custom | -- | `[System addition]` 160x160px, 12px stroke, recharts or custom SVG |
| Status label | Styled text | -- | Semantic color on dark surface |
| Breakdown chips | Chips | `Chips 3.0` | 3 compact chips, dark variant |
| "How this works" link | Link | `Link 3.0` | Size M, Standard, appending arrow |
| Coming Up list | List | `List 3.0` | 52px rows, icon + text + right-aligned amount |
| Bill urgency circles | Custom | -- | 32x32px, may extend Indicator 3.0 dot |
| Est./Manual badges | Badge | `Badge 3.0` | Size S, Neutral variant |
| Spending Pace bar | Progress Linear | `Progress/Linear` | Determinate, 342x6px |
| Smart Action cards | Lifecycle Banner | `Lifecycle banner 3.0` | 328x68px, image right |
| Instacash bridge | Banner | `Banners 3.0` | Standard (0) variant, with button group |
| Explainer sheet | Bottom Sheet | -- | `[System addition]` or fallback to push screen |
| Setup buttons | Button Group | `Button Group 3.0` | Stacked, 343x104px |
| Manual input fields | Input | `Input 3.0` | Prepend icon variant for currency |
| Frequency chips | Chips | `Chips 3.0` | Single-select, 4 options |
| Date picker | Calendar | `Calendar` / `Date 3.0` | 343px, date type |
| Settings rows | List | `List 3.0` | 52-80px rows, disclosure chevrons |
| Toggle switches | Switch | `Switch 3.0` | 48x48px touch target |
| Progress steps | Progress Linear | `Progress/Linear` | Steps variant, 3 steps |
| Stale banner | Banner | `Banners 3.0` | Warning (4), above hero |
| Error banner | Banner | `Banners 3.0` | Negative (3), above hero |
| Skeleton states | Skeleton | -- | Skeleton gradient animation per MLDS |
| Bill row accordion | Accordion | `Accordion 3.0` / `Accordion item 3.0` | Inline expand, 16px padding |

---

## Validation Needs

The riskiest assumptions in this spec, ranked by potential rework cost.

| # | Assumption to Validate | Risk | Cheapest Test |
|---|---|---|---|
| 1 | STS formula excluding typical discretionary spend | If STS only subtracts committed bills, the number reads as unrealistically high. Users will see "$342 safe" but know groceries, gas, and daily spend will eat most of it. They'll distrust the number immediately. | Show 5-8 target users the explainer sheet. Ask: "Does this number match your reality? What's missing?" If >50% say it's too high, typical spending must be subtracted. |
| 2 | Instacash threshold at 10% of income | A fixed ratio may fire too early for high earners ($500 remaining still triggers) or too late for low earners ($20 remaining doesn't trigger). | Simulate 3 profiles: $1,500/mo income, $3,000/mo, $6,000/mo. Walk through when the card appears. Gut-check with PM whether each feels right. |
| 3 | "Estimated" badge as sole confidence signal | A text badge may be too subtle to build trust with Stretched users who need to believe the number before acting on it. | Prototype A/B: (A) "Estimated" text badge, (B) mini confidence meter (low/med/high). 5-user unmoderated test. Measure: "How much do you trust this number?" on 1-5 scale. |
| 4 | Instacash bridge copy tone | "Spot you" and "Get covered" may still read as sales to financially stressed users. The line between helpful and predatory is contextual. | Show 3 copy variants to target users in a "You May Come Up Short" scenario. Open-ended prompt: "How does this make you feel?" Look for: trust, relief vs. pressure, annoyance. |
| 5 | Showing only 3 bills in Coming Up | If the user's biggest bill is #4+ in the list, the Hub feels like it's missing the point. The total is visible in chips, but the list might feel incomplete. | Post-launch: log "See all" tap rate. If >60% tap within first week, default to showing 5 bills. |
| 6 | Manual user value without Spending Pace | Manual users get no Spending Pace, no detected bills, and a static number. The tier gap may feel so large that manual users churn before converting to linked. | Track setup completion --> 7-day return for manual vs. linked. If manual day-7 retention drops below 20%, the manual experience needs more standalone value. |

---

## Design Decisions Log

Decisions made in this spec that should be reviewed with stakeholders:

| Decision | Rationale | Review with |
|---|---|---|
| Instacash card placed in For You, not above hero | Above-hero placement is reserved for system warnings (stale data, errors). Placing a product offer there conflates alerts with sales, violating trust principle. | PM, Legal |
| Bills are optional in manual setup | Requiring bills creates friction that blocks users from seeing the feature value. Income is the true minimum. | PM |
| No cents displayed in STS | Displaying "$342.47" implies precision the model can't deliver. Whole dollars reduce false precision risk (per risks doc). | PM, Engineering |
| Ring on dark surface | Matches established Cashflow ring hero pattern. Creates visual separation between the "what" (hero) and the "why" (scrollable detail below). | Design system team |
| Spending Pace hidden for manual users | No transaction data means no meaningful pace to show. Showing a placeholder would imply capability that doesn't exist. | PM |
| 3-dismissal limit on Instacash nudge per cycle | Balances business conversion goals with user respect. Persistent nudges after explicit dismissal feel predatory. | PM, Growth |
| "Why am I seeing this?" on Instacash card | Per risks doc: recommendations need visible rationale. Transparency reduces perception of sales optimization. | Legal |
| Status thresholds at 20% and 5% of income | Percentage-based adapts to income level. Absolute thresholds ($50, $150) would feel wrong for users at different income levels. | PM, Engineering, Data |

---

*This spec is a design starting point, not a locked contract. Every screen inherits the assumptions at the top. Change an assumption, flag the affected screens, and I'll rework them.*

*v1 — April 2026*
