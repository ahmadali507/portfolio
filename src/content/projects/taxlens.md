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
hook: 'Where does the tax go? One dashboard sets what citizens pay against what the government spends.'
signature:
  title: 'A public dashboard that needs no login'
  text: 'Anyone can pick a date range and compare the tax reported by citizens with government project budgets and spending.'
strengths:
  - title: 'A scraper that keeps the record current'
    text: 'A scraper reads five public sources, removes duplicates by project name, and updates the database. A small scheduler runs it every hour.'
  - title: 'Failure stays contained'
    text: 'Each source has its own fallback, so one broken source does not take the projects page down with it.'
  - title: 'Open reads, guarded writes'
    text: 'Row-level security lets anyone read the shared view, while only the owner of a record can add, change, or delete it.'
  - title: 'Two questions, one screen'
    text: 'The public view runs two server queries in parallel over the chosen dates: one totals the tax and its contributors, the other totals budgets and spending.'
  - title: 'A personal ledger'
    text: 'Signed-in users upload tax slips and see their own breakdown by category, with a six-month trend.'
features:
  - 'Tax slip upload with amount, date, and category'
  - 'Personal dashboard with charts'
  - 'Government project grid with budget, progress, ministry, and status'
  - 'Public view by date range with bar and pie charts'
  - 'Light and dark themes'
proves: 'I can design one data model that safely serves two very different audiences, and own the pipeline that feeds it.'
media:
  placeholder: false
public: false
placeholder: false
---

Citizens upload tax slips with an amount, a date, and a category to their own dashboard with monthly trends.

A scraper pulls government project data from several official sources every hour, removes duplicates, and keeps going when one source fails.

The public expenditure page runs its queries in parallel and draws the comparison as bar and pie charts.
