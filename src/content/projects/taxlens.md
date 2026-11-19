---
title: 'TaxLens'
summary:
  value: 'A civic platform that compares the tax citizens report paying with the government project spending it scrapes.'
  placeholder: false
featured: true
order: 6
status:
  value: 'shipped'
  placeholder: false
role:
  value: 'Lead developer in a team of three'
  placeholder: false
year:
  value: 2025
  placeholder: false
stack:
  value: ['Next.js', 'TypeScript', 'Supabase', 'Cheerio', 'Recharts']
  placeholder: false
problem:
  value: 'Citizens cannot easily see how the tax they pay compares with what the government allocates and actually spends.'
  placeholder: false
outcome:
  value: 'A public dashboard, open without signing in, compares tax collected with budget allocated and spent for any date range.'
  placeholder: false
links:
  - label: 'Source'
    url: 'https://github.com/ahmadali507/Tax-Lens'
    placeholder: false
media:
  placeholder: false
public: false
placeholder: false
---

Citizens upload tax slips with an amount, a date, and a category to their own dashboard with monthly trends.

A scraper pulls government project data from several official sources every hour, removes duplicates, and keeps going when one source fails.

The public expenditure page runs its queries in parallel and draws the comparison as bar and pie charts.
