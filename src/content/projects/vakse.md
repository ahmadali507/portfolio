---
title: 'Vakse'
summary:
  value: 'A procurement platform where buyers run requests for proposal with vendors, from first quote to final payment.'
  placeholder: false
featured: true
order: 2
status:
  value: 'in-progress'
  placeholder: true
role:
  value: 'Built at OnePercent Technologies'
  placeholder: true
year:
  value: 2026
  placeholder: true
stack:
  value: ['Next.js', 'TypeScript', 'Supabase', 'PostgreSQL', 'Stripe Connect', 'TanStack Query']
  placeholder: false
problem:
  value: 'Companies were buying through email threads and spreadsheets: quotes, approvals, purchase orders, and payments lived in different places with no single record.'
  placeholder: false
outcome:
  value: 'One system now covers the whole purchasing cycle, from request to recorded payment, with approvals wherever a company needs them.'
  placeholder: false
links: []
media:
  placeholder: false
public: false
placeholder: false
---

A multi-step RFP wizard lets buyers enter items by hand, from a CSV, or from a PDF, and assign them to vendors. Vendors answer with proposals that buyers compare side by side.

One reusable approval engine, with up to three sequential levels, governs requests, vendor invites, purchase orders, receiving, and payments.

Vendors onboard through Stripe Connect. Payments can be escrow-style or direct, manual or scheduled in installments that a database cron job runs and retries. Every payment event is appended, never overwritten, and access is scoped per company with row-level security.
