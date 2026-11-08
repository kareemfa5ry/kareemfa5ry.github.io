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
    alt: "Nesma Airlines sales dashboard in Power BI, with dummy numbers: total revenue of $175.32M (up $96M, 120%, on last year), 1.83M transactions, 1.6M passengers, a yield of $112.2, revenue split into fare, surcharge, penalty, service, ancillary, discount and commission cards, a daily yield and passenger line chart from mid-2022 to late 2024, and a currency list led by EGP at 54.31%."
    caption: "Main dashboard with the filter panel closed (dummy numbers)"
  - src: ../../assets/projects/customer-route-analytics-power-bi/02-main-dashboard-filter-open.png
    alt: "The same sales dashboard, with dummy numbers, with the filter panel open: ten dropdown slicers (DOA_Year, DOA_Mon, SOURCE, OPER_TYPE, ACTION, Sales_Channel, Country, Sector, Route, OUT_IN), all set to All, with Clear and Close buttons."
    caption: "Main dashboard with the filter panel open (dummy numbers)"
  - src: ../../assets/projects/customer-route-analytics-power-bi/03-decomposition-tree.png
    alt: "Decomposition tree, with dummy numbers, that splits total revenue of $175,317,486.67 by source, country, currency, travel agent, route, sector and trip type, following BSP ($126,919,364.68), Egypt ($49,252,594.72), EGP, WONDER TRAVEL, RUH(CAI) and CAI/RUH down to one-way trips at $2,401,638.46."
    caption: "Revenue broken down level by level, from source to trip type (dummy numbers)"
  - src: ../../assets/projects/customer-route-analytics-power-bi/04-revenue-by-country-map.png
    alt: "Revenue by country, with dummy numbers, shown as a bar list, a world map and a table: Egypt leads with $89M (51.21%) ahead of Saudi Arabia with $70M (40.17%), and the table total is $173,788,802.60."
    caption: "Revenue by country as bars, a map and a table (dummy numbers)"
  - src: ../../assets/projects/customer-route-analytics-power-bi/05-data-model.png
    alt: "Power BI data model with one sales fact table, SALES_NE_YTD, linked one-to-many to lookup tables for fare basis, booking class, sale, action and departure dates, country, travel agent, service type, advance payment, currency and sector routes."
    caption: "Data model: one sales fact table with its linked lookup tables"
---

- Built dashboards for demand forecasting, customer segmentation, personalised offers and customer churn.
- Used averages, medians and spread measures, box plots to find outliers, and significance tests on sampled routes to check whether differences between routes were real before acting on them.
- The dashboards covered forecasting, customer segmentation, personalised offers and churn.
- Data was modelled as a star schema: a central fact table joined one-to-many to lookup tables, in Power BI and in Excel's Data Model, loaded with Power Query.
- Statistics were used to check before acting. Mean, median and spread described each route, box plots exposed outliers, and significance tests on sampled routes separated a real difference from chance, to prove or reject a hypothesis.
- Classification sorted customers into groups, which fed the segmentation and the personalised offers, and churn analysis showed who was likely to stop booking.
- The tools were Power BI, Power Query and Excel.
