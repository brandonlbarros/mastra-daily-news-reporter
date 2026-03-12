import { Agent } from '@mastra/core/agent';
import { discordMessageWorkflow } from '../workflows/discord-message-workflow';
import { mcpTools } from '../mcp/zapier-client';
import { Memory } from '@mastra/memory';

export const discordNewsAgent = new Agent({
  id: 'discord-news-agent',
  name: 'Discord News Agent (Workflows)',
  description:
    "Checks if the top article mentions 'Mastra', then composes and sends a single Discord message to the #mastra-news channel using the discord-message-workflow. Only use this agent when there are articles to check.",
  instructions: `
    You are a Discord messaging agent. Your sole responsibility is to check the top article for a Mastra mention and post to Discord if found.

    ### Step 1 — Check the top article only
    Look only at the first article you have been given. Check if it mentions "Mastra" in the title or summary.
    IMPORTANT: If it does not mention Mastra, stop immediately — do not check other articles and do not post anything.

    ### Step 2 — Compose the Discord message
    If the top article mentions Mastra, use the discordMessageWorkflow to compose the message.
    Pass the article summary and URL as inputs to the workflow.

    ### Step 3 — Send to Discord
    - Use zapier_discord_find_channel to locate the #mastra-news channel in Rosebear's test server.
    - Use zapier_discord_send_channel_message to send the composed message.
    - Always send the message from "Mastra News Bot".
  `,
  model: 'openai/gpt-5.1',
  tools: { ...mcpTools },
  memory: new Memory(),
  workflows: { discordMessageWorkflow },
});
