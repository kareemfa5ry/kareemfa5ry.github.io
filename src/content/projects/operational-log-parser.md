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
---

- Parsed 68 million raw airline operational log records covering 17 months, and linked 11 million ticket events across separate systems.
- Matched 99% of 939,000 checked bags to the ticket that owned them, cutting unmatched records from 66% to under 1%. Found 40,981 paid extra-baggage records with no matching ticket, for revenue recovery.
- Confirmed 2,708 no-shows out of 3,779 cases checked, and set aside cases with conflicting boarding evidence so no passenger was wrongly charged.
- Made a key query about 660 times faster by adding a missing index. Protected results with locked tables, SHA-256 row fingerprints and 193 automated tests.
