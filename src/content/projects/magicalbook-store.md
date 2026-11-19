---
title: 'MagicalBook.Store'
summary:
  value: 'Turns photos of a child into a personalized, illustrated storybook, delivered as an eBook or a printed hardcover.'
  placeholder: false
featured: true
order: 1
status:
  value: 'shipped'
  placeholder: false
role:
  value: 'Built and operates it'
  placeholder: false
year:
  value: 2026
  placeholder: true
stack:
  value: ['Next.js', 'TypeScript', 'Supabase', 'Gemini', 'OpenAI', 'Stripe', 'Google Cloud Tasks']
  placeholder: false
problem:
  value: 'Parents want a book where their own child is the hero, with the same face and outfit on every page, not a template with a name swapped in.'
  placeholder: false
outcome:
  value: 'Live in English and Czech, taking real payments, and shipping printed hardcovers through a print-on-demand partner.'
  placeholder: false
links:
  - label: 'Live site'
    url: 'https://magicalbook.store'
    placeholder: false
  - label: 'Czech store'
    url: 'https://magickakniha.cz'
    placeholder: false
media:
  placeholder: false
public: false
placeholder: false
---

Book generation runs as a chain of small, resumable steps on Google Cloud Tasks, so a crash halfway through picks up where it stopped instead of starting over or charging twice.

A consistency engine builds a cast from the reference photos and keeps faces, outfits, and props the same across the cover and every scene. Each job goes to the model that does it best: one writes the story, one keeps the likeness, one paints the scenes, and one checks them.

Every image passes an automated safety review before a parent can see it. Checkout, coupons, print quotes, fulfillment webhooks, and refunds on failure are all handled in the same system.
