---
title: 'Scrape-Stripe'
summary:
  value: 'A serverless pipeline that syncs Stripe customers and subscriptions into BigQuery every day for analytics.'
  placeholder: false
featured: false
order: 10
status:
  value: 'shipped'
  placeholder: true
role:
  value: 'Built it'
  placeholder: false
year:
  value: 2026
  placeholder: true
stack:
  value: ['Python', 'Google Cloud Functions', 'Cloud Run', 'BigQuery', 'Secret Manager', 'Stripe API']
  placeholder: false
problem:
  value: 'Billing data lived only in Stripe, so questions about revenue and churn needed manual exports.'
  placeholder: false
outcome:
  value: 'Stripe data lands in BigQuery every day, as a raw audit copy and clean tables that BI tools can query directly.'
  placeholder: false
links:
  - label: 'Source'
    url: 'https://github.com/ahmadali507/Scrape-Stripe'
    placeholder: false
media:
  placeholder: false
public: false
placeholder: false
---

A scheduled cloud function fetches only what changed since the last run and records each sync.

The warehouse is layered: raw JSON for audit, processed tables, a unified customer view, and a BI snapshot.

A longer second sync runs as a Cloud Run job, credentials live in Secret Manager under a least-privilege account, and every step is provisioned by repeatable scripts.
