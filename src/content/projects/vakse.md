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
hook: 'Procurement in one place, from the first request for proposals to the last vendor payment.'
signature:
  title: 'One approval engine behind every decision'
  text: 'Requests, vendor invitations, purchase orders, receiving, and payments all pass through the same approval engine. It moves level by level: everyone at one level approves before the next level is asked.'
strengths:
  - title: 'A guided request builder'
    text: 'A nine-step wizard builds each request for proposals. Items come in by hand, from a CSV file, or from a PDF, and nothing is lost when the buyer steps back.'
  - title: 'Payment terms settled by rule'
    text: 'When a purchase order is submitted, a set of pure rules decides how each vendor is paid, from the methods, terms, and readiness on both sides.'
  - title: 'Vendors paid through Stripe Connect'
    text: 'Vendors onboard through Stripe Connect Express. Payments run as escrow-style or direct charges, and every payment event is appended to an audit log.'
  - title: 'Installments that run themselves'
    text: 'A database schedule and an edge function find the installments that are due and process them, triggered by acceptance, delivery, or a vendor request.'
  - title: 'Each party sees only its part'
    text: 'Row-level security scopes data by company and role. A vendor sees only the items assigned to it, and a database constraint blocks duplicate payment requests.'
features:
  - 'Separate buyer and vendor dashboards'
  - 'Side-by-side offer comparison'
  - 'Purchase orders with fulfillment and receiving'
  - 'Vendor onboarding and product catalogue'
  - 'Buyer and vendor chat with attachments'
  - 'Notifications and email invitations'
  - 'Vendor payment requests'
proves: 'I can take a messy business process with roles, permissions, audit trails, and money, and turn it into structured software where correctness comes first.'
media:
  placeholder: false
public: false
placeholder: false
---

A multi-step RFP wizard lets buyers enter items by hand, from a CSV, or from a PDF, and assign them to vendors. Vendors answer with proposals that buyers compare side by side.

One reusable approval engine, with up to three sequential levels, governs requests, vendor invites, purchase orders, receiving, and payments.

Vendors onboard through Stripe Connect. Payments can be escrow-style or direct, manual or scheduled in installments that a database cron job runs and retries. Every payment event is appended, never overwritten, and access is scoped per company with row-level security.
