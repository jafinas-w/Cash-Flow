# Cashflow V2 — Phase B Dashboard Exploration

> **Status:** Three directional concepts for review. Convergence pending.
> **Locked decisions feeding into Phase B:**
> - Primary metric is Safe to Spend (STS), confirmed
> - All eight Phase 1 sections are in (hero, bills, Smart Actions, income, spending, recap, activity timeline, confidence explainer)
> - Section *ordering* is open
> - Negative-STS and low-confidence states are first-class design problems, not edge cases

---

## The two design problems that drive this

Before the concepts, two states we cannot afford to design as afterthoughts:

### Problem 1 — Negative STS

The Stretched user mid-cycle sees `-$45.20`. They are already anxious. A literal-but-honest dashboard ("You have -$45.20 to spend") is technically correct and emotionally hostile. It also misses MoneyLion's strongest play: this is the exact moment Instacash earns the right to surface.

**Design commitments for the negative state across all three concepts:**
- The number is shown, not hidden. Trust requires honesty.
- The framing reduces shame and adds a finish line. `$45 short until Friday` reads better than `-$45.20 Safe to Spend`.
- A Smart Action card for Instacash auto-surfaces immediately, named in MoneyLion strategy language (`Cover`, `Advance`, `Bridge`), never `Loan` or `Borrow`.
- Surrounding sections reorder to support recovery, not to maintain layout consistency.

### Problem 2 — Low or no detection

The 24-hour-window user. The user with bills missing. The user whose bv-linked account doesn't show their primary spend. Dashboard cannot be empty, cannot be a fake STS number, cannot be a wall of "we need more info."

**Design commitments for the low-confidence state across all three concepts:**
- We always show what we *can* know — bank balance, recent spending, paycheck cadence if detected
- The hero adapts. We don't force STS into a slot we can't fill confidently.
- A clear path back to Overview to improve detection, surfaced as a positive ("see your full forecast") not a guilt trip ("complete your profile")
- Confidence tag is always visible when STS is estimated. Tappable to explain.

---

## Concept 1 — STS-First Classic

> *"The dashboard you'd expect, executed cleanly."*

### Hero
Dark surface (matching draft), Safe to Spend as a large number, line chart below showing balance trajectory across the paycheck cycle.

### Layout (top to bottom)
1. **Hero card** — dark, full-width
   - Title: `Safe to Spend as of Apr 21`
   - Number: `$1,606.80` (Display Md)
   - Confidence chip when applicable
   - Chart: balance trajectory, last paycheck → today → next paycheck (projected)
   - 3 metric tiles below chart: Income remaining, Days to paycheck, Today's spend
2. **Smart Actions** — only renders when triggered (negative STS, bill due, etc.)
3. **Upcoming bills** — next 7 days
4. **Income / next paycheck** — when, how much, source
5. **Monthly recap** — collapsed by default
6. **Spending breakdown** — categories, last 30 days
7. **Activity timeline** — Smart Action lifecycle feed
8. **Improve your forecast** — link back to Overview

### State variants

| State | Hero treatment |
|---|---|
| High confidence + positive STS | Number + chart, no chip |
| High confidence + negative STS | Number stays (`-$45.20`), but title becomes `$45 short until Friday`. Smart Action card for Instacash auto-pinned directly below hero. Chart shows the gap. |
| Partial confidence | Number + `Partial estimated` chip next to the title. Chart still shown. |
| Building your view | Number replaced with `We're learning your patterns`. Chart hidden. Shows balance + last paycheck instead. CTA to Overview. |

### Smart Action surfacing rule
Triggered, not always-on. Triggers in priority order:
1. STS negative or projected negative within 3 days → Cover (Instacash)
2. Bill due in <3 days + STS insufficient → Cover
3. Surplus detected at end of cycle → Grow (savings move) — *Phase 2*
4. Direct deposit not set up + paycheck detected externally → Win the paycheck nudge

### Confidence tag placement
Right of the title (`Safe to Spend as of Apr 21  [Partial estimated]`), tappable to bottom sheet explainer.

### Trade-offs
- **Strengths:** Familiar, fast to comprehend, low learning curve, easy to build, leverages MoneyLion's Instacash strength on negative state.
- **Weakness:** Doesn't differentiate MoneyLion from Mint/Copilot/Cleo. The dashboard looks like every other STS dashboard. Users may not return because there's nothing here they couldn't get elsewhere.
- **Best served:** Phase 1 risk-minimizing audience. The PM team that needs to ship.

### Build complexity
[Low lift]. Most components exist. Smart Action card is the only system-net-new.

---

## Concept 2 — Cycle-Anchored

> *"Teach the user the rhythm. STS becomes a position, not a number."*

### Hero
Light surface. The dominant element is a **paycheck cycle visualization** — a horizontal arc or timeline rendering today's position between last and next paycheck. STS is shown *as a label on the arc*, not as the hero number itself.

The visualization makes the user's cycle visible: where the paycheck landed, where it's been spent, where the bills hit, where today is, where next paycheck arrives. STS is the resulting balance at "today" position.

### Layout (top to bottom)
1. **Cycle hero card** — light or contextual surface
   - Title: `Your cycle`
   - Cycle arc: anchor points are paycheck dates and major bill due dates
   - Today's STS rendered as the value at the "today" position: `$1,606 left until Friday`
   - Projected low point shown on the arc with a marker (`Lowest: $42 on Apr 25`)
2. **Upcoming bills** — chronological, mapped to positions on the cycle above
3. **Smart Actions** — triggered, same rules as Concept 1
4. **Income / next paycheck** — emphasized, since it's the cycle's anchor
5. **Spending breakdown**
6. **Monthly recap**
7. **Activity timeline**
8. **Improve your forecast**

### State variants

| State | Hero treatment |
|---|---|
| High confidence + positive STS | Full cycle arc with projected low point. Today's STS as label. |
| High confidence + negative STS | Arc breaks visually at the negative crossing point. Title becomes `$45 short, $200 paycheck Friday`. Smart Action card for Instacash pinned. |
| Partial confidence | Arc shown with what's known (paycheck cadence usually detects fast); STS gets `Partial estimated` chip. Bills section may be sparse. |
| Building your view | Arc replaced with simple `Your paycheck arrived Apr 14, next on Apr 28` — no STS, no projection. Below: balance + last spend. CTA to Overview. |

### Smart Action surfacing rule
Same triggers as Concept 1, but cards reference cycle positions: `Cover the gap to Friday's paycheck` instead of generic `Cover the shortfall`.

### Confidence tag placement
On the arc itself when projection is uncertain. The dashed portion of the arc represents projected (vs actual) balance.

### Trade-offs
- **Strengths:** Strong differentiator. Teaches users their own cycle, building an identity-relationship with the product. Future-forward, predictive feel. Maps directly to MoneyLion's cash-flow-cycle research framing (relief → pressure → stress → anxiety). Naturally serves the See pillar deeper than any competitor.
- **Weakness:** Higher learning curve. Glance-and-go users (the literal "how much can I spend?") have to interpret the visualization. Build complexity is meaningfully higher.
- **Best served:** Stretched users who feel the cycle viscerally and would value seeing it externalized. Less ideal for Stable users who don't think in cycle terms.

### Build complexity
[Medium-large lift]. The cycle arc is a custom data viz component, not in MLDS. Recharts can render the underlying line, but the marker/anchor system needs custom design and engineering. Animation and reduced-motion handling adds time.

### Risk
Users may not parse the arc as quickly as a number. Worth a 5-user comprehension test before locking.

---

## Concept 3 — State-Adaptive Hero

> *"The hero changes shape based on what the user needs right now."*

### Hero
The hero metric and visual treatment change based on user state. Not a single layout — three variants of the same hero, swapped based on detection + STS sign:

| User state | Hero shape |
|---|---|
| High confidence + positive STS | STS-First number + chart (Concept 1's hero) |
| High confidence + negative STS | **Cover-First** — Instacash bridge card becomes the hero. Title: `Cover the gap to Friday`. STS shown as a smaller secondary line: `You're $45 short until your $1,200 paycheck.` |
| Building / Low confidence | **Learning-First** — copy and CTA dominate. `We're learning your patterns.` Below: what we do know (balance, last paycheck), and a single CTA to Overview. |

### Layout (top to bottom)
The section stack itself adapts:

| State | Section order |
|---|---|
| Positive STS | STS hero → Bills → Smart Actions (often empty) → Income → Recap → Spending → Activity → Improve |
| Negative STS | Cover hero → Smart Actions (auto-pinned, Cover focus) → Bills → Income → Spending → Activity → Improve |
| Building | Learning hero → Improve forecast (elevated) → What we know (balance, last paycheck) → Bills (if any) → Spending → Activity |

### Smart Action surfacing rule
Same triggers, but Smart Actions move to position #2 in negative state instead of being event-injected mid-stack. The hero IS the action when STS is negative.

### Confidence tag placement
Tag is part of the hero in all states. In Building state, the tag *becomes* the explanation — there's no number to explain.

### Trade-offs
- **Strengths:** Best UX for each user state. Directly serves MoneyLion's "Personalize every path" strategic pillar. Aligns with the cash-flow-cycle stress-point research. Negative state stops being a degraded fallback and becomes its own first-class moment. The Cover pillar earns its first-class hero appearance, which Instacash has never had.
- **Weakness:** Highest build cost. Three hero variants to design, prototype, and maintain. Risk of feeling inconsistent ("the dashboard changes too much"). Harder to QA — three layouts × four detection states = twelve unique screens to validate.
- **Best served:** All users at the moment they most need MoneyLion. The product's strategic ambition lives here.

### Build complexity
[Medium lift] for the layout swap, [Large scope] if Cover-First is implemented end-to-end with Instacash integration in Phase 1. Phase 1-feasible version: Cover-First hero with placeholder Instacash CTA that routes to existing Instacash flow.

### Risk
The "dashboard feels different each time I open it" reaction. Mitigation: keep the layout grid identical across states; only the hero card content changes. Sections below remain in roughly the same place, just reordered by relevance.

---

## Comparison

| Dimension | Concept 1 — STS Classic | Concept 2 — Cycle-Anchored | Concept 3 — State-Adaptive |
|---|---|---|---|
| **Differentiation** | Low | High | High (different axis) |
| **Glanceability** | High | Medium | High (in positive state) |
| **Negative-state UX** | Good | Good | Best |
| **Low-confidence UX** | Functional | Functional | Best |
| **Build complexity** | Low | Medium-Large | Medium-Large |
| **Strategic alignment** | See pillar only | See pillar (deep) | See + Cover + Personalize pillars |
| **Risk** | Low (boring) | Medium (learning curve) | Medium (consistency perception) |
| **What it sacrifices** | Differentiation | Glanceability | Build simplicity |

---

## My recommendation

**Concept 3, with Concept 1's hero as the positive-STS variant.**

Reasoning:
1. The negative-STS state is the moment MoneyLion's product surface most uniquely advantages over neobanks and budget apps. Instacash is the differentiator. Concept 3 elevates that to the hero, which Concept 1 only does as an injected card and Concept 2 doesn't really resolve.
2. The low-confidence state is the largest hidden user population (anyone in their first 24 hours, anyone with a non-primary bank linked). Concept 3 is the only concept that designs an honest hero for them rather than a degraded version of the positive hero.
3. The "Personalize every path" strategic pillar from `company-context.mdc` is currently a deck claim with no surface to back it. Concept 3 makes the dashboard the proof point.
4. Concept 2's cycle visualization is genuinely strong but expensive and unproven. Worth holding as a Phase 2 evolution of Concept 3's positive-STS hero, once we know the dashboard is earning return engagement.

If Phase 1 build budget is tight, **Concept 1** is the safe ship. Don't ship Concept 2 in Phase 1 — the cycle viz needs research validation before committing the build.

---

## What I need from you to lock Phase B

1. **Concept direction:** 1, 2, or 3 (or a hybrid with rationale)
2. **Section ordering** — confirm the order I've proposed for the chosen concept, or rerank
3. **Negative-STS reframing copy** — `$45 short until Friday` vs `Bridge to payday` vs your call. Strongly recommend you don't use `-$45.20 Safe to Spend` literally
4. **Smart Action triggers in scope for Phase 1** — I have four proposed; which are in?
5. **Light or dark hero?** Concept 1 leans dark (matches draft), Concept 2 leans light, Concept 3 is flexible

Once those are answered, I'll produce the locked Phase B section of `flow.md` with screen-by-screen breakdown, all state variants, copy for each moment, MLDS components per section, and the risk to validate. Then we build the canvas.
