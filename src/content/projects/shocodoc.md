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
hook: 'A document editor where everyone types at once and nobody overwrites anybody.'
signature:
  title: 'Live editing, with people and comments in the page'
  text: 'Several people edit the same document at the same time. Avatars show who is here, and comment threads attach to the exact words they are about.'
strengths:
  - title: 'Edits that merge instead of colliding'
    text: 'Each document is a real-time room. The editor state syncs through a conflict-free data type, so two people typing in the same paragraph both keep their words.'
  - title: 'One identity across services'
    text: 'A small bridge turns the signed-in user into a room identity with a name, an avatar, and a cursor color.'
  - title: 'Three roles, enforced twice'
    text: 'Creator, editor, and viewer. The server checks access before a document loads, and the interface hides what a role cannot use.'
  - title: 'Comments, mentions, and an inbox'
    text: 'Threads anchor to a text selection and can be resolved. Granting access sends an inbox notification, and mentions autocomplete as you type.'
  - title: 'Watched in production'
    text: 'Error monitoring with source maps covers both server runtimes, with a global error boundary in front of the user.'
features:
  - 'Rich text formatting with headings and quotes'
  - 'Share by email as editor or viewer'
  - 'Live collaborator avatars'
  - 'Mentions with autocomplete'
  - 'Notification bell with an unread count'
  - 'Click-to-edit titles'
  - 'Delete with confirmation'
proves: 'I can join authentication, real-time infrastructure, and a rich text framework into one deployed product, including the access control that makes shared editing usable.'
media:
  placeholder: false
public: false
placeholder: false
---

Rich text runs on Lexical, synced in real time through Liveblocks rooms, with live avatars for everyone in the document.

A custom bridge turns a signed-in user into a room token, and three roles, creator, editor, and viewer, are enforced both on the server and in the interface.

Documents are shared by email. Comments thread on selected text, and an inbox of notifications brings people back to the right document.
