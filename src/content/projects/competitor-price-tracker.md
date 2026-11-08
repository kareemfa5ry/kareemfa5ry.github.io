---
title: "Competitor price tracker"
org: Nesma Airlines
period: "2023–2024"
order: 5
summary: >-
  A scheduled scraper that collects competitors' one-way and 14-day return fares 90 days ahead and emails the cleaned data to the commercial team every day.
stack: [Python, Web scraping, Scheduled tasks, Power Query]
skills: [programming, bi-and-reporting]
metrics:
  - value: "90 days"
    label: of future fares collected
  - value: "8"
    label: competing airlines per route, at most
screenshots: []
bullets:
  - "Started as a script that captured fare calendar screenshots for the daily report. Grew into a scheduled scraper on company servers collecting one-way and 14-day return prices 90 days ahead for up to eight competing airlines per route."
  - text: "Cleaned data was emailed automatically every day to the commercial team, the revenue team and the chairman, and fed the pricing dashboards."
    cv: [sda]
  - text: "The goal was daily market prices for every route, to support pricing decisions, inspired by earlier use of a paid fare-tracking service."
    cv: []
  - text: "Version 1 (2023) was a script that opened a browser, used a fare calendar view, took a screenshot per route, compressed the images and attached them to the daily report email for the commercial and revenue teams."
    cv: []
  - text: "Version 2 (late 2023 onward) was a full scraper deployed on the airline's own servers. Every day it collected prices for the target routes for the next three months, one-way and return with the return 14 days later."
    cv: []
  - text: "Output was a price table per route with one column per competing airline. Each raw record kept the reading date, sector, departure and return dates, carrier, airports, flight times and price."
    cv: []
  - text: "Each daily run sent a completion notice."
    cv: []
  - text: "Tools: Python, web scraping and Windows scheduled tasks."
    cv: []
---
