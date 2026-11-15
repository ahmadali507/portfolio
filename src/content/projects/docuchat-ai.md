---
title: 'DocuChat AI'
summary:
  value: 'Question answering over uploaded documents, built on a RAG pipeline.'
  placeholder: false
featured: true
order: 2
status:
  value: 'shipped'
  placeholder: true
role:
  value: 'Engineer, retrieval pipeline and API'
  placeholder: true
year:
  value: 2025
  placeholder: true
stack:
  value: ['Next.js', 'TypeScript', 'Supabase', 'PostgreSQL', 'LLM APIs']
  placeholder: true
problem:
  value: 'A team kept the answers to routine questions inside long documents that few people had time to read.'
  placeholder: true
outcome:
  value: 'People ask in plain language and get an answer with the passage it came from, so they can check it.'
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

Uploads go on a queue. A worker splits each document into passages, embeds them, and stores them next to their source page.

At question time the API ranks passages, passes the best few to the model with the question, and returns the answer with citations. When nothing relevant is found, it says so.
