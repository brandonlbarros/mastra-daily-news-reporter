import { z } from 'zod';
import { mastra } from '../index';

// ─── Schemas ────────────────────────────────────────────────────────────────

const recencyInputSchema = z.object({
  text: z.string(),
  referenceDate: z.string(),
});

// ─── Seed ────────────────────────────────────────────────────────────────────

async function seedDatasets() {
  // ── News Recency Dataset ────────────────────────────────────────────────

  const recencyDataset = await mastra.datasets.create({
    name: 'news-recency',
    description: 'Test cases for evaluating how well the news agent does at pulling recent articles',
    inputSchema: recencyInputSchema,
  });

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

  await recencyDataset.addItems({
    items: [
      {
        input: {
          text:
            `1. Anthropic raises $2B — Published: ${hoursAgo(2)}\n` +
            `2. Mistral AI closes $600M round — Published: ${hoursAgo(5)}\n` +
            `3. Cohere secures $500M — Published: ${hoursAgo(10)}`,
          referenceDate: now.toISOString(),
        },
        groundTruth: {
          expectedRecency: 1.0,
          notes: 'All three articles are within the last 24 hours.',
        },
      },
      {
        input: {
          text:
            `COVID 2020`,
          referenceDate: now.toISOString(),
        },
        groundTruth: {
          expectedRecency: 0.67,
          notes: 'Two articles are 25–48h old (score 0.5 each); one is under 24h (score 1.0). Average ≈ 0.67.',
        },
      },
      {
        input: {
          text:
            `1. Bitcoin hits all-time high — Published: ${hoursAgo(80)}\n` +
            `2. Fed raises interest rates — Published: ${hoursAgo(100)}\n` +
            `3. Stripe launches new payment API — Published: ${hoursAgo(90)}`,
          referenceDate: now.toISOString(),
        },
        groundTruth: {
          expectedRecency: 0.0,
          notes: 'All articles are older than 72 hours, scoring 0.',
        },
      },
      {
        input: {
          text:
            'LIVE: AI Summit 2026 — Updates streaming continuously as the event unfolds.',
          referenceDate: now.toISOString(),
        },
        groundTruth: {
          expectedRecency: 1.0,
          notes: 'Continuously updated live coverage always scores 1.0.',
        },
      },
      {
        input: {
          text:
            `1. Carbon capture startup raises $80M — Published: ${hoursAgo(20)}\n` +
            `2. EU passes new climate legislation — Published: ${hoursAgo(50)}\n` +
            `3. Solar panel efficiency record broken — Published: ${hoursAgo(60)}`,
          referenceDate: now.toISOString(),
        },
        groundTruth: {
          expectedRecency: 0.5,
          notes: 'One under 24h (1.0), two between 48–72h (0.25 each). Average = 0.5.',
        },
      },
    ],
  });

  console.log(`Created dataset: ${recencyDataset.id} (news-recency) with 5 items`);
}

seedDatasets().catch(console.error);
