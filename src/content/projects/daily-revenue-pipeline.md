---
title: Daily revenue data pipeline and forecasting dashboard
org: Nesma Airlines
period: "2026"
order: 1
summary: >-
  A daily PostgreSQL pipeline that loads ticket and flight exports, forecasts every flight departing in the next
  14 days and flags the ones that need a pricing or inventory action.
stack: [PostgreSQL, Materialized views, Python, React, GraphQL, Redis]
skills: [sql-and-databases]
metrics:
  - value: "17"
    label: restartable stages in the daily load
  - value: ~9 min
    label: for a normal daily run
screenshots: []
---

- Loads daily ticket and flight exports into PostgreSQL and applies only the rows that changed, found by comparing
  checksums. Runs in 17 stages that restart from the point of failure; a normal daily run takes about 9 minutes.
- Forecasts every flight departing in the next 14 days by comparing its bookings so far with similar past flights,
  then scores each flight and flags the ones that need a pricing or inventory action.
- Moved the heavy processing from Python into the database after the first version needed 35 GB of memory and
  stalled.
