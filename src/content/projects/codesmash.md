---
title: 'Codesmash'
summary:
  value: 'A real-time coding battle platform where two players race to solve the same problem, live.'
  placeholder: false
featured: true
order: 3
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
  value: ['Next.js', 'TypeScript', 'Socket.IO', 'Bun', 'Redis', 'BullMQ', 'MongoDB', 'Judge0']
  placeholder: false
problem:
  value: 'Coding practice is solitary and easy to abandon. A live opponent and a clock make it a game people come back to.'
  placeholder: false
outcome:
  value: 'Two players code side by side while each sees the other type, tests run on every submit, and the winner climbs a ranked leaderboard.'
  placeholder: false
links: []
media:
  placeholder: false
public: false
placeholder: false
---

Game rooms run on Socket.IO with host, challenger, and spectator roles enforced on the server. Each keystroke streams to the opponent and to spectators.

A server-side state machine moves every match from waiting to ready to in progress to finished, and handles wins, forfeits, timeouts, and draws.

Code runs through Judge0 in four languages: sample tests on Run, the full hidden set on Submit. Match timers live in Redis and BullMQ, so a server restart does not lose a game in progress.
