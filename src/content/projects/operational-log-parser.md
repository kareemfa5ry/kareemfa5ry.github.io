---
title: "Operational log parser and revenue checks"
org: Nesma Airlines
period: "2026"
order: 2
summary: >-
  A PostgreSQL parser that turns 68 million raw operational log records into linked ticket events, used to find unmatched baggage revenue and confirm no-shows.
stack: [PostgreSQL, Triggers, Python, SHA-256, Automated tests]
skills: [sql-and-databases, programming, revenue-assurance]
metrics:
  - value: "68M"
    label: raw operational log records parsed
  - value: "99%"
    label: of 939,000 checked bags matched to their ticket
  - value: "~660×"
    label: faster key query after adding an index
screenshots: []
results:
  - label: Unmatched baggage records
    before: 66
    after: 1
    unit: "%"
    note: cut from 66% to under 1%
---

- Parsed 68 million raw airline operational log records covering 17 months, and linked 11 million ticket events across separate systems.
- Matched 99% of 939,000 checked bags to the ticket that owned them, cutting unmatched records from 66% to under 1%. Found 40,981 paid extra-baggage records with no matching ticket, for revenue recovery.
- Confirmed 2,708 no-shows out of 3,779 cases checked, and set aside cases with conflicting boarding evidence so no passenger was wrongly charged.
- Made a key query about 660 times faster by adding a missing index. Protected results with locked tables, SHA-256 row fingerprints and 193 automated tests.
- The problem was raw airline operational logs that no one could trust. The aim was linked, trusted records, then lost revenue and wrong no-show charges found from them.
- The parser produced 11.17 million cross-system ticket links and 1.78 million coupon life-cycle timelines. All 51 of 51 reconciliation checks passed.
- Baggage: 931,769 of 938,632 checked bags matched to the owning ticket, and bag-tag matching precision rose from 67.2% to 99.99% once reused tags were handled.
- Missing ticket links fell from 65.7% to 0.5%. Check-in matched to flights in 99.81% of cases across 7,886 flights.
- For 363,614 tickets with no boarding record, a four-level intended-flight finder raised coverage from 0% to 69.1%, with accuracy of 97.4% to 99.9% on known test cases.
- Joining the commercial data with airport data showed 3,225 coupons boarded on a different flight than ticketed.
- Controls: tables locked by state-machine triggers (created, running, completed), SHA-256 fingerprints of rows and files, one view per consumer, and 74 of 74 static checks passing alongside the 193 automated tests.
