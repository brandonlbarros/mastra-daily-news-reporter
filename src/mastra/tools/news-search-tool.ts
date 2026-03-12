import { createTool } from '@mastra/core/tools'
import z from 'zod'
import Exa from 'exa-js'

export const newsSearch = createTool({
  id: 'news-search-tool',
  description: 'Uses Exa to search for news',
  inputSchema: z.object({
    query: z.string().min(1).describe('The search query'),
  }),
  outputSchema: z.array(
    z.object({
      title: z.string().nullable(),
      url: z.string(),
      text: z.string(),
      publishedDate: z.string().optional(),
    }),
  ),
  execute: async inputData => {
    const exa = new Exa(process.env.EXA_API_KEY)

    // Use today's midnight EDT (UTC-4 = 04:00 UTC) as the cutoff so that
    // articles with no time component are treated as published at midnight EDT.
    const now = new Date()
    const edtMidnight = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      4, 0, 0, 0,  // midnight EDT = 04:00 UTC
    ))

    const { results } = await exa.search<{ text: true }>(inputData.query, {
      startPublishedDate: edtMidnight.toISOString(),
      category: "news",
      numResults: 5,
      contents: { text: true },
    })

    return results.map(result => ({
      title: result.title,
      url: result.url,
      text: result.text,
      publishedDate: result.publishedDate,
    }))
  },
})