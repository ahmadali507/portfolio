---
title: 'Shocodoc'
summary:
  value: 'A collaborative document editor built on CRDTs.'
  placeholder: false
featured: true
order: 1
status:
  value: 'shipped'
  placeholder: true
role:
  value: 'Lead engineer, editor and sync layer'
  placeholder: true
year:
  value: 2025
  placeholder: true
stack:
  value: ['TypeScript', 'React', 'Node.js', 'PostgreSQL']
  placeholder: true
problem:
  value: 'Several people had to edit one document at once, with no central lock and no lost edits when a connection dropped.'
  placeholder: true
outcome:
  value: 'Edits merge in any order and reach the same text on every screen. Changes made offline sync when the connection returns.'
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

Each client keeps its own copy of the document as a CRDT. A keystroke becomes an operation that can merge with any other operation, so the server relays and stores operations and never has to pick a winner.

Presence, cursors, and history ride on the same operation log. Reloading a document replays a compacted snapshot plus the operations after it.
