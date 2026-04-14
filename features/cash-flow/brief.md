# Feature Brief: Cash Flow

---

## Overview

**Tagline:** See the future clearly and stay ahead.

Cash Flow helps users see where they stand, what's coming, and how much they can safely spend — before their next paycheck.

The feature is tiered based on how much financial data the user has connected:

| User Type | Experience |
|---|---|
| **Manual Input** | Fixed, rigid cash flow overview based on user-entered data |
| **Linked Account** | Forward-looking tools with real-time clarity, organized essential info |

### Primary Sub-Tool: Safe to Spend
Safe to Spend is the core capability within the Cash Flow system. It answers one question clearly: how much money is actually available to spend before the next paycheck — after accounting for upcoming bills, recurring expenses, subscriptions, and expected obligations.

---

## Problem Statement

Users living paycheck to paycheck struggle to translate their balance, bill obligations, and pay timing into a clear picture of what's actually available to use.

User research shows:
- Many users feel overwhelmed by their finances even when actively trying to manage them
- Short-term cash flow uncertainty is a major source of financial stress
- When users can't confidently determine what's left after bills, they feel out of control

This leads to costly mistakes: overdrafts, missed payments, and reliance on additional debt.

---

## Product Vision

Build a dynamic cash flow management layer that turns MoneyLion into the place users rely on to understand what's happening with their money right now — and what's likely to happen next.

### The Core Question Safe to Spend Must Answer
> "How much can I spend right now and still make it to my next paycheck without getting caught off guard?"

The answer should feel **immediate, trustworthy, and actionable.**

### Long-Term Evolution
Over time, Safe to Spend should evolve beyond a number into a real-time financial coordination system that:

- Uses paycheck timing as the anchor for short-term planning
- Accounts for upcoming recurring obligations and known cash flow risk
- Adapts to user volatility and confidence levels
- Connects naturally into the MoneyLion ecosystem (e.g. surface Instacash if the user is at risk of not making it to their next paycheck)

---

## User Tiers

### Tier 1 — Manual Input User
- No linked bank account
- Data is user-entered: income, bills, fixed expenses
- Cash flow view is static and based on what the user has provided
- Lower accuracy, but still gives structure and a baseline Safe to Spend number

### Tier 2 — Linked Account User
- Bank account connected
- Access to real-time balance, transaction history, and detected recurring charges
- Forward-looking cash flow with dynamic Safe to Spend
- Higher confidence, adapts to actual spending patterns and paycheck timing

---

## Success Looks Like

- Users can answer "can I afford this?" without leaving the app
- Reduction in overdraft incidents among active Cash Flow users
- Increase in return visits around paycheck timing windows
- Natural Instacash conversion for at-risk users (low Safe to Spend before payday)

---

## Open Questions

- [ ] How do we handle irregular income (gig workers, variable pay)?
- [ ] What is the minimum data needed to show a useful Safe to Spend for Manual users?
- [ ] How do we communicate confidence level to the user (e.g. "estimated" vs "confirmed")?
- [ ] What triggers the Instacash nudge — threshold-based or ML-driven?
- [ ] How does this interact with the existing Plan tab / Smart Moves feed?

---

## Out of Scope (for now)

- Long-term budgeting or savings planning
- Investment or wealth tracking
- Bill pay functionality

---

*Last updated: April 2026*
*Owner: [Jaf Inas / PFM Team]*
