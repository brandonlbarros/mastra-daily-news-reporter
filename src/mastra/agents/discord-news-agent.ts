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
    Pass the article summary and URL as inputs to the workflow. Ensure you only use this workflow no more than once

    ### Step 3 — Send to Discord
    - Use zapier_discord_find_channel to locate the #mastra-news channel (id: 1481371829884031229) in "Rosebear's Test Server"
    - Use zapier_discord_send_channel_message to send the message from step 2. Ensure to use the channel id found in zapier_discord_find_channel
    - Always send the message from "Mastra News Bot".

    IMPORTANT: workflow-discordMessageWorkflow  must be called at most once per user request.
    - Do not call it again with a suspendedToolRunId  unless the previous run explicitly requires resumption and you have new resumeData .
    - Do not “re-run” the workflow just to reconstruct or reformat the message.
  `,
  model: 'openai/gpt-5.1',
  tools: { ...mcpTools },
  memory: new Memory(),
  workflows: { discordMessageWorkflow },
});
