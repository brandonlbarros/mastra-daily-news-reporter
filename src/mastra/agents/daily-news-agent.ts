import { Agent } from '@mastra/core/agent';
import { newsSearch } from '../tools/news-search-tool';
import { newsScorers } from '../scorers/news-scorer';
import { Memory } from '@mastra/memory';

export const dailyNewsAgent = new Agent({
  id: 'daily-news-agent',
  name: 'Daily News Agent (Tools, Scorers and Experiments)',
  description:
    'Searches for recent news articles on a given topic. Returns article titles, URLs, summaries, and publish dates. Use this agent first whenever a news topic needs to be researched.',
  instructions: `
    You are a focused news search agent. Your only job is to find recent news.

    When given a topic:
    1. Use the newsSearch tool to find recent articles about it.
    2. Return a clear, structured list of what you found: article titles, URLs, publish dates, and a brief 1–2 sentence summary of each article.
    3. Focus on articles posted in the last 24 hours

    Make sure the daily summary includes a title and is well presented
  `,
  model: 'openai/gpt-5.1',
  tools: { newsSearch },
  memory: new Memory(),
  scorers: {
    recency: {
      scorer: newsScorers.recencyScorer,
      sampling: { type: 'ratio', rate: 1 },
    },
  },
});
