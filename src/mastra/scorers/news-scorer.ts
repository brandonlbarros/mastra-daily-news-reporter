import { z } from 'zod';
import { createScorer } from '@mastra/core/evals';
import {
  getAssistantMessageFromRunOutput,
  getUserMessageFromRunInput,
} from '@mastra/evals/scorers/utils';

function hoursAgoToScore(hoursAgo: number | null, continuouslyUpdated = false): number {
  if (continuouslyUpdated) return 1;
  if (hoursAgo === null || hoursAgo === undefined) return 0;
  if (hoursAgo <= 24) return 1;
  if (hoursAgo <= 48) return 0.5;
  if (hoursAgo <= 72) return 0.25;
  return 0;
}

export const recencyScorer = createScorer({
  id: 'recency-scorer',
  name: 'Recency Scorer',
  description:
    'Judges how recent each article in the agent response is, then averages the scores — ideal responses contain news from the last 24 hours',
  type: 'agent',
  judge: {
    model: 'openai/gpt-5-nano',
    instructions:
      'You are an expert evaluator of news freshness. ' +
      'Your job is to assess how recent each article in an agent response is, ' +
      'relative to the reference date provided. ' +
      'Look for explicit dates, timestamps, or temporal cues for each article. ' +
      'Return only structured JSON matching the provided schema.',
  },
})
  .preprocess(({ run }) => {
    const response = getAssistantMessageFromRunOutput(run.output) || '';
    const referenceDate = new Date().toISOString();

    // Treat undated articles as published at 11:59 PM UTC on the date they appear to be from.
    const now = new Date();
    const endOfDayUtcIso = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 0, 0)
    ).toISOString();

    return { response, referenceDate, endOfDayUtcIso };
  })
  .analyze({
    description: 'Evaluate per-article recency relative to today, then average',
    outputSchema: z.object({
      articles: z.array(z.object({
        title: z.string(),
        dateFound: z.string().nullable(),
        hoursAgo: z.number().nullable(),
        withinLastDay: z.boolean(),
        continuouslyUpdated: z.boolean(),
      })),
      explanation: z.string(),
    }),
    createPrompt: ({ results }) => `
      You are evaluating how recent each article is in an agent response.

      Current date and time (ISO 8601, UTC):
      """
      ${results.preprocessStepResult.referenceDate}
      """

      Assumed publication time for articles with a date but no explicit time (11:59 PM UTC today):
      """
      ${results.preprocessStepResult.endOfDayUtcIso}
      """

      Agent response (contains multiple articles):
      """
      ${results.preprocessStepResult.response}
      """

      For EACH article found in the response:
      1) Identify its title or headline.
      2) Check if the article is continuously updated — a live blog, breaking news feed, real-time tracker,
         or any source described as "live", "updating", "rolling coverage", or "continuously updated".
         If so, set continuouslyUpdated to true and skip steps 3–5 (set dateFound and hoursAgo to null, withinLastDay to true).
      3) Otherwise, find the most recent date or timestamp explicitly mentioned or strongly implied.
         - If the article has a full timestamp (date + time), use it as-is.
         - If the article has only a date with no time, assume it was published at 11:59 PM UTC
           (i.e., use the "Assumed publication time" value above, adjusted to the article's date).
      4) Calculate approximately how many hours ago that was relative to the current date and time above.
      5) Set withinLastDay to true if hoursAgo <= 24.
         If no date can be determined, set dateFound and hoursAgo to null and withinLastDay to false.

      Return JSON with fields:
      {
        "articles": [{ "title": string, "dateFound": string | null, "hoursAgo": number | null, "withinLastDay": boolean, "continuouslyUpdated": boolean }],
        "explanation": string
      }
    `,
  })
  .generateScore(({ results }) => {
    const r = (results as any)?.analyzeStepResult || {};
    const articles: any[] = r.articles ?? [];
    if (articles.length === 0) return 0;
    const total = articles.reduce((sum: number, a: any) => sum + hoursAgoToScore(a.hoursAgo, a.continuouslyUpdated), 0);
    return Math.max(0, Math.min(1, total / articles.length));
  })
  .generateReason(({ results, score }) => {
    const r = (results as any)?.analyzeStepResult || {};
    const articles: any[] = r.articles ?? [];
    const withinDayCount = articles.filter((a: any) => a.withinLastDay).length;
    const liveCount = articles.filter((a: any) => a.continuouslyUpdated).length;
    const liveNote = liveCount > 0 ? ` (${liveCount} live/continuously updated).` : '.';
    return (
      `Recency scoring: ${withinDayCount}/${articles.length} articles within last 24h${liveNote} ` +
      `Average score=${score}. ${r.explanation ?? ''}`
    );
  });

export const newsScorers = {
  recencyScorer,
};
