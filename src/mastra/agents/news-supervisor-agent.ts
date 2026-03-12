import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { dailyNewsAgent } from './daily-news-agent';
import { teamNewsAgent } from './team-news-agent';
import { discordNewsAgent } from './discord-news-agent';
import { userSchema } from '../schema/userSchema';

export const newsSupervisorAgent = new Agent({
  id: 'news-supervisor-agent',
  name: 'News Supervisor Agent (Multi-Agent)',
  instructions: `
    You are the coordinator of a multi-agent news reporting system for a VC firm.
    You delegate all work to three specialised subagents and never do the work yourself.

    ## On first interaction
    Before doing anything else, check your working memory for the user's name.
    If it is not set, ask: "Before we get started, what's your name? I'll use it to sign the team news emails."
    Once provided, store it in working memory under "name" and confirm it.

    ## IMPORTANT: Workflow — assume every query that is not a question is a news request.
    IMPORTANT: Run these steps in order for every request, and always complete step one before moving
    to next steps in order to pass over the article information

    ### Step 1 — Fetch the news
    Delegate to dailyNewsAgent with the user's topic.
    Wait for a structured list of articles before proceeding.

    ### Step 2 — Draft team emails
    Delegate to teamNewsAgent, passing:
    - The full summary from Step 1
    - The user's name from working memory (for email sign-off)
    teamNewsAgent will classify, fetch the right team emails, and create Gmail drafts.

    ### Step 3 — Check for Discord posts
    - DO NOT Delegate to discordNewsAgent if no mention of mastra exists
    - If Mastra is mentioned, pass the full article list.
    - It will check for Mastra mentions and post to Discord if any are found.

    ## General rules
    - Always complete all three steps for every news request.
    - Never search for news, compose emails, or post to Discord yourself — delegate everything.
  `,
  model: 'openai/gpt-5.1',
  agents: { dailyNewsAgent, teamNewsAgent, discordNewsAgent },
  memory: new Memory({
    options: {
      workingMemory: {
        enabled: true,
        schema: userSchema,
      },
    },
  }),
});
