# Risks: Cash Flow / Safe to Spend

A working reference of known risks across the feature. Use this to pressure-test decisions during design and flag early for legal, compliance, and engineering.

---

## 1. Onboarding / Setup

| Risk | Why It Matters |
|---|---|
| **Over-promising before data exists** | Cash flow accuracy depends on linked accounts and history. If signup copy implies precision users won't get on day one, trust erodes fast. |
| **Connection friction vs. completion** | Every extra step (link bank, verify, RoarMoney vs. external) drops funnel completion. Incomplete linking can produce a worse number than no number. |
| **Partial financial picture** | Users may link one account while bills and spend live elsewhere. UI that doesn't clearly flag "incomplete view" can read as authoritative when it's partial. |
| **Multi-account / joint / household ambiguity** | Income and obligations may span people or accounts the user didn't connect — "your" cash flow may not match their mental model. |
| **Partner / aggregator limits** | Institution downtime, MFA churn, stale balances, or delayed categorization affect what onboarding promises (e.g. "real-time," "always up to date"). |
| **Consent and explainability** | Users need to understand why linking improves the experience and what data is used — especially where PFM feeds personalization and offers. |
| **Regulatory / compliance surface** | Anything touching eligibility, rates, or product framing (e.g. Instacash adjacent) needs review. Onboarding is where mis-framing often slips in. |

---

## 2. Safe to Spend (Formula, Commitments, Transparency)

| Risk | Why It Matters |
|---|---|
| **Definition ≠ user's truth** | `income − upcoming spend = safe to spend` is simple in UI and hard in life. Pay cycle timing, holds, pending charges, and "upcoming" definitions will disagree with bank balances. |
| **Cash-based / off-rails commitments** | Rent paid in cash, roommate splits, employer deductions, or side gig income are invisible to typical aggregation. STS can be materially wrong without explicit handling and messaging. |
| **Classification errors** | Mis-labeled income, transfers treated as spend, or one-off large transactions skew STS and are hard for users to debug without strong "why this number" UX. |
| **Estimated vs. committed spend** | Mixing committed lines, typical spend curves, and estimates (e.g. groceries) risks users treating estimates as guarantees — variance creates surprise and blame on the product. |
| **False precision** | Showing cents or narrow bands implies accuracy. Stretched users may make irreversible decisions (fees, missed bills) based on that number. |
| **Liability and expectations** | If users interpret STS as advice or a guarantee, there is UDAP/reputation risk unless disclaimers and education match the actual model — needs legal sign-off. |
| **Stale or delayed data** | "Safe" can become unsafe after a few hours of spending. Without clear as-of semantics, the number feels broken. |
| **Segment skew** | Stretched/strained users have more volatile, harder-to-model cash flow. The same formula will feel "wrong" more often for the primary segment. |

---

## 3. Action Interface (Recommendations, Outlook, Offers, Notifications)

| Risk | Why It Matters |
|---|---|
| **Recommendations perceived as sales** | PFM bridges to Instacash, Split, marketplace, etc. If actions feel optimized for revenue rather than user stability, it burns trust in the whole feature. |
| **Outlook / chart misread** | Forward-looking views (committed vs. typical, donut breakdowns) can be read as predictions. Users may not internalize uncertainty bands or missing cash bills. |
| **Bad timing** | Nudges during financial stress can help — or feel predatory if tied to advances or credit at the wrong moment. |
| **Notification fatigue and channel risk** | Push, email, and SMS have different compliance and opt-in rules. Over-messaging drives churn and unsubscribes. |
| **Personalization opacity** | ML-ranked offers without clear "why me / why now" increase discomfort, especially across Gen Digital surfaces and brands. |
| **Inconsistent narratives** | If STS says "you're fine" but the outlook shows a cliff — or marketplace pushes unrelated products — the experience feels incoherent. |
| **Activity / offer relevance** | Irrelevant or ineligible offers waste attention and train users to ignore the entire action layer. |

---

## 4. Cross-Cutting

These cut across all three areas above and warrant their own early alignment.

| Area | Risk |
|---|---|
| **Compliance** | Financial outcomes, rates, EWA framing, and investment touchpoints need explicit review. Plan for copy and flow gates early. |
| **Security & privacy** | Richer cash flow UI increases sensitivity of on-screen data and notifications (shoulder surfing, shared devices). |
| **Design system & rebrand** | Brand refresh in flight — prototypes may need alignment to avoid rework later. |
| **Ops & support** | A wrong STS number drives "your app is broken" contacts. Internal docs on how the number is built are needed before launch. |
| **Metrics gaming** | Optimizing for engagement or offer CTR can conflict with trust as a differentiator. Align north stars before build. |
| **Ecosystem dependencies** | Bill pay, subscription manager, and RoarMoney-as-home for paychecks will change what "complete" means. This feature may ship into a moving roadmap. |

---

## Design Implications

Pull these into reviews as a checklist:

- [ ] Does onboarding copy make accuracy claims we can't back up on day one?
- [ ] Is the "incomplete data" state clearly communicated in the UI?
- [ ] Is every STS number labeled with its as-of time?
- [ ] Does the UI distinguish estimated vs. committed spend clearly?
- [ ] Do recommendations have visible rationale ("why this, why now")?
- [ ] Have offer placements been reviewed against the trust risk of feeling like sales?
- [ ] Has legal reviewed any Instacash-adjacent framing in Cash Flow copy?

---

*Source: [PFM] Safe to Spend Risks — internal document*
*Last updated: April 2026*
