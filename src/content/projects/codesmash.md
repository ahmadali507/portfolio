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
hook: 'Two programmers, one problem, one clock. Everyone else watches the code appear.'
signature:
  title: 'A match the server referees'
  text: 'Both players write in a browser editor while the opponent''s code streams in live. The server owns the game state, and a timer that survives a restart decides the result.'
strengths:
  - title: 'A state machine for every match'
    text: 'Each game moves through waiting, ready, in progress, and finished. A match can end by a win, a forfeit, a timeout, or a draw.'
  - title: 'Rooms that know who you are'
    text: 'Each game has its own socket room. Only the host can start, only the challenger can mark ready, and only players can send code or forfeit. Spectators watch.'
  - title: 'Real code, really run'
    text: 'Code runs through Judge0 in four languages. Run checks the sample tests and Submit checks the full set. Progress moves only when a submission beats the player''s best.'
  - title: 'A clock that survives restarts'
    text: 'Each match has a delayed job in a Redis-backed queue. It resumes when the server starts and, when time runs out, compares passed tests to name a winner or a draw.'
  - title: 'A score worth playing for'
    text: 'Players earn points for newly passed tests and for match results. The points feed a leaderboard and profile statistics.'
features:
  - 'Invite and open challenges'
  - 'Spectator mode'
  - 'JavaScript, Python, C++, and Java'
  - 'Console and test output panel'
  - 'Forfeit and timeout handling'
  - 'Leaderboard and profiles'
  - 'Challenge history'
proves: 'I can build real-time multiplayer software where the server stays the single source of truth.'
media:
  placeholder: false
public: false
placeholder: false
---

Game rooms run on Socket.IO with host, challenger, and spectator roles enforced on the server. Each keystroke streams to the opponent and to spectators.

A server-side state machine moves every match from waiting to ready to in progress to finished, and handles wins, forfeits, timeouts, and draws.

Code runs through Judge0 in four languages: sample tests on Run, the full hidden set on Submit. Match timers live in Redis and BullMQ, so a server restart does not lose a game in progress.
