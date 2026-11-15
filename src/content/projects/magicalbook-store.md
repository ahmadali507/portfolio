---
title: 'MagicalBook.Store'
summary:
  value: 'Personalized storybooks written with AI.'
  placeholder: false
featured: true
order: 5
status:
  value: 'shipped'
  placeholder: true
role:
  value: 'Engineer, storefront and generation flow'
  placeholder: true
year:
  value: 2024
  placeholder: true
stack:
  value: ['Next.js', 'Supabase', 'LLM APIs']
  placeholder: true
problem:
  value: 'Parents wanted a story with their own child in it, not a template with a name swapped in.'
  placeholder: true
outcome:
  value: 'Each order produces a book written for one child, checked before it goes out.'
  placeholder: true
links:
  - label: 'Live site'
    url: '#'
    placeholder: true
  - label: 'Source'
    url: '#'
    placeholder: true
media:
  placeholder: true
public: false
placeholder: true
---

An order collects a few details about the child. A queued job writes the story in chapters, then a review step checks each chapter for the details it was given.

The storefront, the order flow, and the generation jobs share one database, so an order can be traced from checkout to the finished book.
