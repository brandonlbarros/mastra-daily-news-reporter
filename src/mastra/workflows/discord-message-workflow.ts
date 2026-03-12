import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const SOCIAL_MEDIA_DOMAINS = [
  'twitter.com', 'x.com', 'instagram.com', 'facebook.com', 'fb.com',
  'tiktok.com', 'linkedin.com', 'threads.net', 'youtube.com', 'youtu.be',
  'reddit.com', 'snapchat.com', 'pinterest.com',
];

function isSocialMediaUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return SOCIAL_MEDIA_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

const discordMessageSchema = z.object({
  message: z.string(),
});

// Step 1: Craft the base Discord message from the article summary and URL
const craftMessage = createStep({
  id: 'craft-message',
  description: 'Crafts a Discord message from an article summary and URL',
  inputSchema: z.object({
    summary: z.string().describe('A short summary of the article'),
    url: z.string().describe('The article or post URL'),
  }),
  outputSchema: discordMessageSchema.extend({
    url: z.string(),
    isSocial: z.boolean(),
  }),
  execute: async ({ inputData }) => {
    const { summary, url } = inputData;
    const isSocial = isSocialMediaUrl(url);

    const message = [`📰 **Mastra in the news!!**`, '', summary, '', url].join('\n');

    return { message, url, isSocial };
  },
});

// Branch step A: social media post — ask for likes and shares
const addSocialCta = createStep({
  id: 'add-social-cta',
  description: 'Appends a likes and shares call-to-action for social media posts',
  inputSchema: discordMessageSchema.extend({
    url: z.string(),
    isSocial: z.boolean(),
  }),
  outputSchema: discordMessageSchema,
  execute: async ({ inputData }) => {
    const message = [
      inputData.message,
      '',
      '👍 If you found this valuable, give it a like and share it — it helps the content reach more people!',
    ].join('\n');

    return { message };
  },
});

// Branch step B: regular article — ask to share with peers
const addPeerShareCta = createStep({
  id: 'add-peer-share-cta',
  description: 'Appends a peer-sharing call-to-action for regular articles',
  inputSchema: discordMessageSchema.extend({
    url: z.string(),
    isSocial: z.boolean(),
  }),
  outputSchema: discordMessageSchema,
  execute: async ({ inputData }) => {
    const message = [
      inputData.message,
      '',
      '💬 Found this interesting? Pass it along to a colleague or teammate who might find it useful!',
    ].join('\n');

    return { message };
  },
});

// Final step: normalise whichever branch ran into a single output
const mergeBranchOutput = createStep({
  id: 'merge-branch-output',
  description: 'Merges the branch output into a single Discord message',
  inputSchema: z.object({
    'add-social-cta': discordMessageSchema.optional(),
    'add-peer-share-cta': discordMessageSchema.optional(),
  }),
  outputSchema: discordMessageSchema,
  execute: async ({ inputData }) => {
    const result = inputData['add-social-cta'] ?? inputData['add-peer-share-cta'];
    if (!result) throw new Error('No branch output found');
    return result;
  },
});

export const discordMessageWorkflow = createWorkflow({
  id: 'discord-message-workflow',
  inputSchema: z.object({
    summary: z.string().describe('A short summary of the article'),
    url: z.string().describe('The article or post URL'),
  }),
  outputSchema: discordMessageSchema,
})
  .then(craftMessage)
  .branch([
    [async ({ inputData }) => inputData.isSocial, addSocialCta],
    [async ({ inputData }) => !inputData.isSocial, addPeerShareCta],
  ])
  .then(mergeBranchOutput);

discordMessageWorkflow.commit();