---
title: 'SearchX'
summary:
  value: 'A search engine for GitHub repositories, built from scratch on a hand-made inverted index and a ranking API.'
  placeholder: false
featured: false
order: 9
status:
  value: 'archived'
  placeholder: true
role:
  value: 'Built it'
  placeholder: false
year:
  value: 2024
  placeholder: false
stack:
  value: ['Python', 'Flask', 'NLTK', 'MessagePack', 'Next.js', 'TypeScript']
  placeholder: false
problem:
  value: 'Hosted search services hide the ranking. This project builds every layer, from tokenizing to ranking, to control relevance and cost directly.'
  placeholder: false
outcome:
  value: 'Each query reads only the index shards it needs, in parallel, and returns ranked results with the search time shown.'
  placeholder: false
links:
  - label: 'Source'
    url: 'https://github.com/ahmadali507/SearchX'
    placeholder: false
media:
  placeholder: false
public: false
placeholder: false
---

An offline pipeline tokenizes and lemmatizes the corpus, builds a forward index with byte offsets, and inverts it into an index split across many small shards.

The Flask ranking API reads only the shards a query touches, on a thread pool, and scores documents on term frequency, density, proximity, and coverage before a heap picks the top results.

A Next.js interface sends the query through a Server Action and shows result cards with the time each search took.
