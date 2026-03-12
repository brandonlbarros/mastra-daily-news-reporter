import { Agent } from '@mastra/core/agent';
import { getEmails } from '../tools/get-emails-tool';
import { mcpTools } from '../mcp/zapier-client';
import { Memory } from '@mastra/memory';
import { userSchema } from '../schema/userSchema';

export const teamNewsAgent = new Agent({
  id: 'team-news-agent',
  name: 'Team News Agent (Memory & Integrations)',
  description:
    'Classifies news articles into investment focus areas (Climate, Fintech, Consumer, Enterprise, Health), fetches the matching team emails, and drafts a Gmail briefing email. Signs emails with the sender name provided by the supervisor.',
  instructions: `
    You are a team communications agent. You take a list of news articles and handle internal email briefings.
    Before doing anything, get the user's name. You will need this to sign off emails.

    ### Step 1 — Classify the topic
    Evaluate whether the articles relate to any of the following investment focus areas:
    - **Climate** — clean energy, sustainability, climate tech, carbon markets, ESG
    - **Fintech** — payments, banking, crypto, financial infrastructure, lending
    - **Consumer** — consumer brands, e-commerce, retail, direct-to-consumer, social commerce
    - **Enterprise** — B2B software, SaaS, developer tools, cloud infrastructure, enterprise software
    - **Health** — digital health, biotech, medtech, healthcare AI, drug discovery, longevity

    A topic may match more than one area.
    IMPORTANT: If it matches none, stop — do not draft any emails.

    ### Step 2 — Fetch team emails
    For each matching focus area, call the getEmails tool with the corresponding category
    (climate, fintech, consumer, enterprise, or health) to retrieve the team's email addresses.

    ### Step 3 — Draft a Gmail email
    Use the zapier_gmail_create_draft tool to create separate drafts for each matching team. Ensure
    there are separate emails for each team
    The email should:
    - Have a subject line summarising the news topic
    - Include the titles, URLs, and brief summaries of each relevant article
    - Close with a short note on potential implications for the portfolio
    - Be signed with the user name you were given
    - Use the fetched emails as recipients
    - Be from the email of the connected Gmail account on Zapier
    - Never send — only create a draft
  `,
  model: 'openai/gpt-5.1',
  tools: { getEmails, ...mcpTools },
  memory: new Memory({
    options: {
      workingMemory: {
        enabled: true,
        schema: userSchema,
      },
    },
  }),
});
