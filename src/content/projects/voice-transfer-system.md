---
title: 'Voice Transfer System'
summary:
  value: 'Live call transfer with answering-machine detection, built on Telnyx.'
  placeholder: false
featured: true
order: 4
status:
  value: 'shipped'
  placeholder: true
role:
  value: 'Engineer, call control and detection'
  placeholder: true
year:
  value: 2025
  placeholder: true
stack:
  value: ['Node.js', 'TypeScript', 'Telnyx']
  placeholder: true
problem:
  value: 'Outbound calls spent agent time on voicemail greetings, and transfers to a live agent sometimes dropped.'
  placeholder: true
outcome:
  value: 'Calls that reach a machine end cleanly. Calls that reach a person move to a live agent without a gap.'
  placeholder: true
links:
  - label: 'Project link'
    url: '#'
    placeholder: true
media:
  placeholder: true
public: false
placeholder: true
---

The service listens to call events from Telnyx and runs answering-machine detection on the first seconds of audio.

When a person answers, it bridges the call to the next free agent and keeps the caller on the line while the bridge forms.
