---
title: "Revenue audit engine"
org: Nesma Airlines
order: 3
summary: >-
  An audit that checks every ticket against filed fare rules and contracted fees and flags 38 categories of partner breach, with Finance accepting about 95% of the cases submitted.
stack: ["Excel & VBA", Power Query, pandas, Amadeus billing files]
skills: [revenue-assurance, bi-and-reporting, programming, source-systems]
metrics:
  - value: "38"
    label: standard breach categories
  - value: "1,305"
    label: breaches found in one quarter across 170 sales partners
  - value: "~95%"
    label: of submitted cases accepted by Finance
screenshots: []
bullets:
  - "Checked every ticket against filed fare rules and contracted fees. Flagged refunds without the required penalty, refunds on non-refundable fares, late cancellations and churning (an agent booking and cancelling the same seats again and again)."
  - "Defined 38 standard breach categories and ran a manual check in parallel before relying on the automation."
  - "One quarter: 1,305 breaches across 170 sales partners, worth about USD 106,000, audited in weekly periods. About 957 were refunds, 171 voids and 100 commission cases. Finance accepted about 95% of the cases submitted."
  - "The problem was finding agent rule breaches and raising debit memos at the airline's scale without an outside audit company."
  - "Two audit streams ran. The fare audit stored newly created fare bases and values in a table, then used rule logic and a lookup to flag differences between coded and used values."
  - "Example: promotional booking classes are non-refundable, so any ticket in them with a refund action is flagged."
  - "The billing audit checked GDS billing data for cost per segment per territory against contracted prices, plus churning and passive segments not cancelled."
  - "A Python desktop decoder reads the monthly GDS billing files and writes churning and passive-segment reports, a top-10 agents summary and a transaction report. Every decision is a fixed rule; no AI model is involved. Churning is repeated booking and cancelling beyond a set limit."
  - "Finance's roughly 95% is an acceptance rate on submitted cases, not an accuracy measure; breaches the rules missed were not counted."
  - "Where cases were rejected, the usual cause was a rule that had not been properly filed, so there was nothing to charge against. The fix is upstream, in the rule data."
---
