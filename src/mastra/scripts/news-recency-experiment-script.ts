import { z } from 'zod';
import { gracefulExit } from 'exit-hook';
import { mastra } from '../index';
import { recencyInputSchema } from '../datasets/recency-dataset';

// ─── ANSI helpers ─────────────────────────────────────────────────────────────

const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  green:  '\x1b[32m',
  cyan:   '\x1b[36m',
};

function scoreColor(score: number) {
  if (score >= 0.75) return c.green;
  if (score >= 0.25) return c.yellow;
  return c.red;
}

function scoreBar(score: number, width = 20) {
  const filled = Math.round(score * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  return `${scoreColor(score)}${bar}${c.reset}`;
}

function scoreLabel(score: number) {
  if (score >= 0.75) return `${c.green}● FRESH${c.reset}`;
  if (score >= 0.25) return `${c.yellow}● MIXED${c.reset}`;
  return `${c.red}● STALE${c.reset}`;
}

function wrap(text: string, maxWidth = 76, indent = '  ') {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    if ((line + word).length > maxWidth) { lines.push(indent + line.trimEnd()); line = ''; }
    line += word + ' ';
  }
  if (line.trim()) lines.push(indent + line.trimEnd());
  return lines.join('\n');
}

const DIVIDER = `${c.dim}${'─'.repeat(60)}${c.reset}`;

// ─── Experiment ───────────────────────────────────────────────────────────────

const { datasets: all } = await mastra.datasets.list();
const dataset = all.find(d => d.name === 'news-recency');

if (!dataset) {
  console.error('Dataset "news-recency" not found. Run recency-dataset.ts first.');
  process.exit(1);
}

const recencyDataset = await mastra.datasets.get({ id: dataset.id });

console.log(`\n${c.bold}${c.cyan}  📰  Recency Experiment — news-recency dataset${c.reset}`);
console.log(`  ${c.dim}Dataset ID: ${dataset.id}${c.reset}`);
console.log(DIVIDER);

const experiment = await recencyDataset.startExperiment({
  targetType: 'agent',
  targetId: 'daily-news-agent',
  scorers: ['recency-scorer'],
});

const total = experiment.results.length;
const passed = experiment.results.filter(r =>
  (r.scores as any[]).some((s: any) => s.score >= 0.75)
).length;

let itemIndex = 0;
for (const result of experiment.results) {
  itemIndex++;
  const input = result.input as z.infer<typeof recencyInputSchema>;
  const scores = result.scores as Array<{ scorerName: string; score: number; reason: string }>;

  console.log(`\n${c.bold}  Item ${itemIndex}/${total}  ${c.dim}query: "${input.content}"${c.reset}`);

  for (const s of scores) {
    const pct = `${Math.round(s.score * 100)}%`;
    console.log(`  ${scoreLabel(s.score)}  ${scoreBar(s.score)}  ${scoreColor(s.score)}${c.bold}${pct}${c.reset}  ${c.dim}(${s.scorerName})${c.reset}`);
    console.log(`${c.dim}${wrap(s.reason)}${c.reset}`);
  }

  console.log(DIVIDER);
}

const summaryColor = passed === total ? c.green : passed > 0 ? c.yellow : c.red;
console.log(`\n${c.bold}  Summary  ${summaryColor}${passed}/${total} items scored ≥ 0.75 (fresh)${c.reset}\n`);

gracefulExit(0);
