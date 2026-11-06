---
title: "Customer and route analytics in Power BI"
org: Nesma Airlines
order: 4
summary: >-
  Power BI dashboards for demand forecasting, customer segmentation, personalised offers and churn, backed by significance tests on sampled routes.
stack: [Power BI, Power Query, Star schema, SQL, Excel]
skills: [bi-and-reporting, statistics-and-analysis, sql-and-databases]
metrics: []
screenshots:
  - src: ../../assets/projects/customer-route-analytics-power-bi/01-main-dashboard-filter-closed.png
    alt: "Power BI-style sales dashboard for a fictional company (illustrative data) with total revenue of $165.23M (up 112.4% on last year), 1.92M transactions, 1.47M passengers, a yield of $112.19, a daily yield and passenger line chart from mid-2023 to late 2025, and a currency list led by NOK at $81,638,101 (49.4%)."
    caption: "Main dashboard with the filter panel closed (illustrative data)"
  - src: ../../assets/projects/customer-route-analytics-power-bi/02-main-dashboard-filter-open.png
    alt: "The same sales dashboard with the filter panel open, showing ten dropdown slicers (Year, Month, SOURCE, OPER_TYPE, ACTION, Sales_Channel, Country, Sector, Route, OUT_IN), all set to All, with Clear and Close buttons."
    caption: "Main dashboard with the filter panel open"
  - src: ../../assets/projects/customer-route-analytics-power-bi/03-decomposition-tree.png
    alt: "Decomposition tree that splits total revenue of $165,234,897.98 by source, country, currency, agent, route, sector and trip type, following Agent ($35,973,586.49), Sweden ($8,906,412.27) and SEK ($6,412,908.14) down to Return trip at $1,018,462.39."
    caption: "Revenue broken down level by level, from source to trip type"
  - src: ../../assets/projects/customer-route-analytics-power-bi/04-revenue-by-country-map.png
    alt: "Revenue by country shown as a bar list, a world map with bubbles and a table: Norway leads with $79.3M (48.0%) ahead of Sweden with $62.8M (38.0%), and the table total is $165,234,897.98."
    caption: "Revenue by country as bars, map bubbles and a table"
  - src: ../../assets/projects/customer-route-analytics-power-bi/05-data-model.png
    alt: "Data model diagram with 13 tables and 12 one-to-many relationships, where the Sales fact table in the lower right is linked to lookup tables such as Fare basis, Sale date, Action date, Sales agent and Agent type."
    caption: "Data model: one sales fact table with 12 linked tables"
---

- Built dashboards for demand forecasting, customer segmentation, personalised offers and customer churn.
- Used averages, medians and spread measures, box plots to find outliers, and significance tests on sampled routes to check whether differences between routes were real before acting on them.
