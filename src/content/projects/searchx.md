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
hook: 'A search engine built from the index up, with no hosted search service underneath.'
signature:
  title: 'An inverted index in 120 barrels'
  text: 'The index is split into 120 shards by word number. A query opens only the shards it needs, so the full index never has to sit in memory.'
strengths:
  - title: 'Language handled before indexing'
    text: 'The lexicon splits text into terms, drops stopwords and links, reduces each word to its base form by part of speech, and gives every term a number.'
  - title: 'Documents found by byte offset'
    text: 'A forward index stores frequency, density, and positions for each document, plus the byte offset of its row. A result is read straight from the file, with no database.'
  - title: 'Shards read in parallel'
    text: 'Four workers read the relevant barrels at once, using the same tokenizing rules at query time as at index time.'
  - title: 'Ranking on several signals'
    text: 'Results are ranked by term frequency, density, how close the query words sit together, and how much of the query they cover.'
  - title: 'The top of the list, without sorting it all'
    text: 'A heap pulls out only the results for the requested page.'
features:
  - 'Ranked, paginated results'
  - 'Query time shown in milliseconds'
  - 'Result cards with stars, forks, and watchers'
  - 'A health endpoint for the service'
proves: 'I can implement information retrieval at the level of the algorithm, which matters when a product needs its own ranking or full control of its search.'
media:
  placeholder: false
public: false
placeholder: false
---

An offline pipeline tokenizes and lemmatizes the corpus, builds a forward index with byte offsets, and inverts it into an index split across many small shards.

The Flask ranking API reads only the shards a query touches, on a thread pool, and scores documents on term frequency, density, proximity, and coverage before a heap picks the top results.

A Next.js interface sends the query through a Server Action and shows result cards with the time each search took.
