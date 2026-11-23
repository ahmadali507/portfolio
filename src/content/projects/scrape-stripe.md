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
hook: 'Billing data that moves itself: Stripe into BigQuery, every day, with nobody watching.'
signature:
  title: 'A warehouse in layers'
  text: 'Raw records are kept in full as an audit trail. Flattened tables, a cross-source customer view, and a customer snapshot sit on top of them for reporting.'
strengths:
  - title: 'Only what changed'
    text: 'Each run fetches the records that are new or changed since the last one, and writes what it did to a sync history table.'
  - title: 'A short job and a long job'
    text: 'A cloud function handles the Stripe sync. A longer job handles a second source, then calls the function back with a flag, so no logic is written twice.'
  - title: 'Secrets stay in the vault'
    text: 'Credentials live only in a secret manager, and the pipeline runs as a dedicated service account with two narrow warehouse roles.'
  - title: 'New customers reach the CRM'
    text: 'New customers are reshaped and posted in batches to a webhook that checks a shared secret.'
  - title: 'Set up by script'
    text: 'Provisioning scripts create the whole pipeline and can be run again without breaking what exists.'
features:
  - 'Daily scheduled sync'
  - 'Manual sync on demand'
  - 'Sync of selected record types'
  - 'Pause, resume, or reschedule'
  - 'Ready queries for recurring revenue, churn, and data freshness'
proves: 'I can design and own a production data pipeline end to end, on a very small infrastructure budget.'
media:
  placeholder: false
public: false
placeholder: false
---

A scheduled cloud function fetches only what changed since the last run and records each sync.

The warehouse is layered: raw JSON for audit, processed tables, a unified customer view, and a BI snapshot.

A longer second sync runs as a Cloud Run job, credentials live in Secret Manager under a least-privilege account, and every step is provisioned by repeatable scripts.
