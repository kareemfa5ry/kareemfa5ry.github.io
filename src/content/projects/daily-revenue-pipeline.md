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
bullets:
  - "Loads daily ticket and flight exports into PostgreSQL and applies only the rows that changed, found by comparing checksums. Runs in 17 stages that restart from the point of failure; a normal daily run takes about 9 minutes."
  - "Forecasts every flight departing in the next 14 days by comparing its bookings so far with similar past flights, then scores each flight and flags the ones that need a pricing or inventory action."
  - "Moved the heavy processing from Python into the database after the first version needed 35 GB of memory and stalled."
  - "The problem was a daily answer for the Revenue Management team: which upcoming flights are filling too fast or too slowly."
  - "PostgreSQL does almost all the work; Python only runs the steps in order, times them, logs results and stops safely on failure. No pandas, Airflow or Spark."
  - "Each CSV export is loaded with PostgreSQL's COPY command into a landing table that is wiped and refilled in one transaction, so a failed load leaves the previous data untouched."
  - "The stages build calendar tables (including the Hijri calendar, which sets Ramadan, Hajj and Umrah demand), compare checksums to update only changed rows, and flag bad records instead of deleting them."
  - "Later stages refresh materialized views for exchange rates, flight totals, KPI summaries, yesterday's sales, sales by country and net position per ticket coupon."
  - "The final stage looks at each flight departing within 14 days. It builds the booking position by class and compares the booking curve with similar past flights at the same point before departure."
  - 'It forecasts the final load, scores the flight and adds rule-based flags such as "high pickup" and "protect inventory".'
  - "The dashboard is a React app: it asks a GraphQL server for data, the server checks a Redis cache and queries PostgreSQL if needed, and the page draws cards, charts and a map. Built with AI coding assistants."
---
