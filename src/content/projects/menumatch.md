---
title: 'MenuMatch'
summary:
  value: 'A restaurant menu platform: admins build themed digital menus, and guests order from a menu behind a QR code.'
  placeholder: false
featured: true
order: 5
status:
  value: 'in-progress'
  placeholder: true
role:
  value: 'Built at OnePercent Technologies'
  placeholder: true
year:
  value: 2025
  placeholder: true
stack:
  value: ['Next.js', 'TypeScript', 'Firebase', 'Firestore', 'Material UI', 'dnd-kit']
  placeholder: false
problem:
  value: 'Restaurants wanted menus they could change in minutes and table orders that reach the kitchen without a paper slip.'
  placeholder: false
outcome:
  value: 'Admins publish a themed menu behind a QR code, guests order from their table, and staff move each order from confirmed to preparing to delivered.'
  placeholder: false
links: []
hook: 'A restaurant menu, built once, themed to the brand, and opened from a QR code on the table.'
signature:
  title: 'A menu builder with an undo for the whole menu'
  text: 'Staff drag sections and dishes into order, theme the menu, and publish it behind a QR code. Every saved version can be brought back.'
strengths:
  - title: 'Four kinds of user, four doors'
    text: 'Platform admins, restaurant admins, customers, and order staff each get their own area. Privileged actions verify the sign-in token and its role on the server first.'
  - title: 'Drag, drop, saved'
    text: 'Sections and dishes reorder by drag and drop, and the new order is written to the database through a server action.'
  - title: 'Import and export without fear'
    text: 'Menus import from JSON through a strict schema, with a confirmation before anything is overwritten. They export to CSV, JSON, and PDF.'
  - title: 'Dishes that know their season'
    text: 'A dish can be always available, available inside a date range, or tied to the dates of Ramadan for that year.'
  - title: 'From the table to the kitchen'
    text: 'A customer''s cart survives a page refresh. Orders move from placed to confirmed, preparing, and delivered on the staff screen.'
features:
  - 'A QR code for every public menu'
  - 'Filtering by label'
  - 'Language switching between menus'
  - 'Colors, fonts, and card styles per menu'
  - 'Table number read from the link'
  - 'Order sheet and confirmation page'
  - 'Logo and background uploads'
proves: 'I can build the whole operating loop of a multi-tenant product: the admin tools, the public pages, and the ordering in between.'
media:
  placeholder: false
public: false
placeholder: false
---

Four role areas, from platform operator to restaurant admin to order viewer to the public menu, are separated by route groups and custom auth claims.

The menu builder handles sections and items with drag-and-drop ordering, themes, versions that can be saved and restored, and availability windows for seasonal menus.

Each menu gets a QR code. Guests filter, switch language, build an order for their table, and confirm it, and the order viewer tracks it to the table.
