import { z } from 'zod';
import { gracefulExit } from 'exit-hook';
import { mastra } from '../index';

export const recencyInputSchema = z.object({
  role: z.enum(['user']),
  content: z.string(),
  referenceDate: z.string(),
});

async function seedRecencyDataset() {
  const recencyDataset = await mastra.datasets.create({
    name: 'news-recency',
    description: 'Test cases for evaluating how well the news agent does with finding recent articles',
    inputSchema: recencyInputSchema,
  });

  const now = new Date();

  await recencyDataset.addItems({
    items: [
      { input: { role: 'user', content: 'Consumer Tech',          referenceDate: now.toISOString() } },
      { input: { role: 'user', content: 'Climate Tech',     referenceDate: now.toISOString() } },
      { input: { role: 'user', content: 'Healthcare Tech',  referenceDate: now.toISOString() } },
      { input: { role: 'user', content: 'COVID',       referenceDate: now.toISOString() } },
      { input: { role: 'user', content: 'COVID 2020',  referenceDate: now.toISOString() } },
    ],
  });

  console.log(`Created dataset: ${recencyDataset.id} (news-recency) with 5 items`);
  return recencyDataset;
}

seedRecencyDataset().then(() => gracefulExit(0)).catch(err => { console.error(err); gracefulExit(1); });
