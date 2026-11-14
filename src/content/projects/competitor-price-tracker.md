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
screenshots:
  - src: ../../assets/projects/competitor-price-tracker/01-fare-matrix-by-airline.png
    alt: "Version 2 fare matrix in Excel for the JED/CAI sector: one row per departure date from 12/06/2024 to 11/07/2024 and one column per airline (Air Arabia Egypt, Air Cairo, Egyptair, Flyadeal, Flyegypt, flynas, Nesma Airlines, Nile Air and Saudia), with the lowest fare of each date in green and the highest in red, next to a slicer of 20 sectors."
    caption: "Fares by departure date and airline for one sector, lowest in green and highest in red"
  - src: ../../assets/projects/competitor-price-tracker/02-fare-calendar-cai-dmm.jpg
    alt: "Version 1 fare calendar for CAI/DMM one way, read on 27 Jul 2023, in EGP: the lowest fare for every day of August and September, from £7,800 to £8,610, with the cheaper days in green."
    caption: "Version 1: a fare calendar per route, captured every day"
  - src: ../../assets/projects/competitor-price-tracker/03-fare-calendar-dmm-cai.jpg
    alt: "Version 1 fare calendar for DMM/CAI one way, read on 27 Jul 2023, in SAR: the lowest fare for every day of August and September, mostly 389 SAR, with the cheapest days at 339 SAR in green."
    caption: "The return direction of the same route, in SAR"
  - src: ../../assets/projects/competitor-price-tracker/04-fare-chart-jed-cai-annotated.png
    alt: "Daily fare chart for JED-CAI one way from late March to May 2023, with notes on 30 March (426 SAR), the lowest fare on 9 April (391 SAR), 10 April (725 SAR) and the peak on 20 April (1,866 SAR)."
    caption: "Daily fares for one route, with the lowest and the peak marked"
  - src: ../../assets/projects/competitor-price-tracker/05-fare-chart-lowest-and-highest.jpg
    alt: "Daily fare chart in SAR from late March to May 2023, marking the lowest fare, 366 SAR on 26 March, and the highest, 1,373 SAR on 20 April."
    caption: "Lowest and highest fare of the period"
  - src: ../../assets/projects/competitor-price-tracker/06-daily-completion-email.jpg
    alt: "The completion email 'Data Scraping and Cleaning Completed', saying the script finished and the cleaned files (MYSec and OAL) were created on 2024-08-06."
    caption: "Version 2: the notice sent after each daily run"
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
