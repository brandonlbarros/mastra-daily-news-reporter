
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { discordMessageWorkflow } from './workflows/discord-message-workflow';
import { newsScorers } from './scorers/news-scorer';
import { newsSupervisorAgent } from './agents/news-supervisor-agent';
import { dailyNewsAgent } from './agents/daily-news-agent';
import { discordNewsAgent } from './agents/discord-news-agent';
import { teamNewsAgent } from './agents/team-news-agent';

export const mastra = new Mastra({
  workflows: { discordMessageWorkflow },
  agents: { dailyNewsAgent, teamNewsAgent, discordNewsAgent, newsSupervisorAgent },
  scorers: { ...newsScorers },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: "file:./mastra.db",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new DefaultExporter(),
          new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
