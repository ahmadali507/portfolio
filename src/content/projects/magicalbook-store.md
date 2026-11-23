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
hook: 'Upload a few photos of a child. Get back a storybook where that child is the hero, with the same face on every page.'
signature:
  title: 'One child, three AI models, one recognizable face'
  text: 'Three different models write, draw, and check each book. A cast sheet built from the reference photos goes into every scene prompt, so the child stays recognizable from the cover to the last page.'
strengths:
  - title: 'Generation that survives a crash'
    text: 'A book is built as a chain of small steps on Google Cloud Tasks. Each step fits inside a serverless time limit and can safely run twice, so a timeout resumes the book instead of restarting it.'
  - title: 'The right model for each job'
    text: 'One model extracts the cast and writes the story. A likeness model draws the avatar. An image model paints the scenes and the cover. A fast vision model reviews the result.'
  - title: 'A safety gate no image skips'
    text: 'A vision model scores every image before a parent sees it. Any unsafe signal forces the score to zero, and the image is drawn again.'
  - title: 'Money handled like money'
    text: 'Payment checks, print jobs, and refunds are guarded against running twice. If a book cannot be finished, the customer is refunded automatically.'
  - title: 'From checkout to a doorstep'
    text: 'Stripe takes the payment and a print partner makes the hardcover. Both send signed webhooks, which are verified and mapped to one order status the customer can follow.'
features:
  - 'Photo upload with cropping'
  - 'Four art styles'
  - 'Avatar and cover preview before paying'
  - 'Page-flip reader'
  - 'Library with edit and download'
  - 'Printed hardcover with a live shipping quote and tracking'
  - 'Public share links'
  - 'English and Czech stores'
proves: 'I can take a hard AI orchestration problem and ship it as a live product that takes payments in two markets, with the tooling to recover when production goes wrong.'
media:
  placeholder: false
public: false
placeholder: false
---

Book generation runs as a chain of small, resumable steps on Google Cloud Tasks, so a crash halfway through picks up where it stopped instead of starting over or charging twice.

A consistency engine builds a cast from the reference photos and keeps faces, outfits, and props the same across the cover and every scene. Each job goes to the model that does it best: one writes the story, one keeps the likeness, one paints the scenes, and one checks them.

Every image passes an automated safety review before a parent can see it. Checkout, coupons, print quotes, fulfillment webhooks, and refunds on failure are all handled in the same system.
