---
title: 'Shocodoc'
summary:
  value: 'A real-time collaborative document editor with live multi-user editing, sharing, and threaded comments.'
  placeholder: false
featured: true
order: 4
status:
  value: 'shipped'
  placeholder: false
role:
  value: 'Built and deployed it'
  placeholder: false
year:
  value: 2025
  placeholder: true
stack:
  value: ['Next.js', 'TypeScript', 'Lexical', 'Liveblocks', 'Clerk', 'Sentry']
  placeholder: false
problem:
  value: 'Teams needed to write in one document at the same time, see who else is there, and discuss a passage without leaving the page.'
  placeholder: false
outcome:
  value: 'Deployed with a live demo: several people edit at once, comments anchor to the text they discuss, and production errors are monitored.'
  placeholder: false
links:
  - label: 'Live demo'
    url: 'https://shocodoc507.vercel.app'
    placeholder: false
  - label: 'Source'
    url: 'https://github.com/ahmadali507/Shocodoc'
    placeholder: false
media:
  placeholder: false
public: false
placeholder: false
---

Rich text runs on Lexical, synced in real time through Liveblocks rooms, with live avatars for everyone in the document.

A custom bridge turns a signed-in user into a room token, and three roles, creator, editor, and viewer, are enforced both on the server and in the interface.

Documents are shared by email. Comments thread on selected text, and an inbox of notifications brings people back to the right document.
