const topics = [
  { t: 'AI models reshape newsroom workflows', c: 'technology', s: 'BBC News' },
  { t: 'Global markets steady after rate decision', c: 'business', s: 'The New York Times' },
  { t: 'New vaccine trial shows promising results', c: 'health', s: 'The Guardian' },
  { t: 'Space telescope captures distant galaxy', c: 'science', s: 'CNN' },
  { t: 'Championship final ends in dramatic tie', c: 'sports', s: 'Fox News' },
  { t: 'Streaming platforms shift release strategy', c: 'entertainment', s: 'CNN' },
  { t: 'Climate summit sets new emission targets', c: 'world', s: 'BBC News' },
  { t: 'Startups race to build green energy storage', c: 'business', s: 'The Guardian' },
  { t: 'Chip makers expand domestic production', c: 'technology', s: 'The New York Times' },
  { t: 'Researchers map ocean heat patterns', c: 'science', s: 'BBC News' },
];

/**
 * Demo articles used when the live news API is unavailable.
 * @returns {Array} list of article objects shaped like NewsAPI results
 */
export function getSampleArticles() {
  return topics.map((item, i) => ({
    title: item.t,
    author: ['A. Reporter', 'J. Writer', 'M. Correspondent'][i % 3],
    description: `${item.t} — an overview of what happened and why it matters.`,
    content: `${item.t}. Reporters covered the story across several days, speaking with people directly involved. Analysts say the outcome could influence related decisions in the months ahead. Further updates are expected as more details emerge.`,
    url: 'https://example.com/article-' + (i + 1),
    urlToImage: `https://picsum.photos/seed/news${i + 1}/600/340`,
    publishedAt: new Date(Date.now() - i * 3600 * 1000 * 5).toISOString(),
    source: { name: item.s },
    category: item.c,
    popularity: 100 - i * 7,
  }));
}
