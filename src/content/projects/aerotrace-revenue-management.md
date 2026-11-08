---
title: "AeroTrace revenue management app"
org: Personal project
order: 6
summary: >-
  A revenue management web app that ranks the flights departing in the next 14 days by risk and shows, for each
  flight, how its bookings, revenue and booking-class mix compare with a benchmark.
stack: [React, TypeScript, GraphQL, Node.js, PostgreSQL, Redis, MapLibre GL, Docker]
skills: [revenue-management, bi-and-reporting]
metrics: []
screenshots:
  - src: ../../assets/projects/aerotrace-revenue-management/01-dashboard-kpis-and-sales-mix.png
    alt: "AeroTrace dashboard for November 2026, with dummy numbers and placeholder names: nine KPI cards (KPI-1 to KPI-9) each compared with the same day last year, for example KPI-1 at 172, down 41% from 293; a sales panel for yesterday (KPI-10 to KPI-13) with revenue contribution bars by currency (Currency 1 at 54%), source, sale type, sector (Sector 1 at 50%), booking class and trip type; and a sales map."
    caption: "Monthly KPIs against last year, yesterday's sales mix and the sales map (dummy numbers, placeholder names)"
  - src: ../../assets/projects/aerotrace-revenue-management/02-rm-watchlist.png
    alt: "RM Intelligence watchlist, with dummy numbers and placeholder names: 60 flights departing in the next 0 to 14 days, 40 of them on watch, shown as cards with flight number, sector, departure date, a watchlist score, load factor, yesterday's yield change and a risk type such as normal, spill or yield dilution."
    caption: "Every upcoming flight scored and sorted by days before departure (dummy numbers, placeholder names)"
  - src: ../../assets/projects/aerotrace-revenue-management/03-flight-detail-overview.png
    alt: "Flight detail panel, overview tab, with dummy numbers and placeholder names: flight 140 two days before departure, score 6.1 (normal), 134 seats sold and a 74.9% load factor, a projected final load factor of 81.0% against a benchmark of 81.9%, seats and revenue still expected to book, the main reason for the score and the recommendation to take no action."
    caption: "One flight: current state, projection against benchmark and the recommendation (dummy numbers, placeholder names)"
  - src: ../../assets/projects/aerotrace-revenue-management/04-flight-detail-booking-curve.png
    alt: "Flight detail panel, charts tab: the flight's daily load factor over the last 30 days before departure, from 30 days out to 2 days out, drawn against the reference booking curve of similar flights and a forecast line."
    caption: "The flight's booking curve against the reference curve"
  - src: ../../assets/projects/aerotrace-revenue-management/05-flight-detail-booking-class-mix.png
    alt: "Flight detail panel, booking class tab, with dummy numbers: 7 booking classes sold, and a table of each class with net seats sold (134 in total), yesterday's seats, its share of seats and its average fare, from 443.5 in the highest class down to 157.4 in the lowest sold class."
    caption: "Seats, share and average fare for each booking class (dummy numbers)"
bullets:
  - "A dashboard compares nine monthly KPIs with the same day last year, each with its change, last year's value and the variance, next to yesterday's sales and how revenue split by currency, source, sale type, sector, booking class and trip type."
  - "A watchlist scores every flight departing in the next 0 to 14 days, flags it as normal, spill or yield dilution, and can be filtered by risk level or sorted by score, load factor or yield change."
  - "Each flight opens a panel with its current bookings and revenue, a projected final load factor against a benchmark, what is still expected to book, the reason behind its score and a recommended action."
  - "The same panel draws the flight's booking curve against the reference curve and a forecast, and breaks bookings down by booking class with net seats, share and average fare."
---
