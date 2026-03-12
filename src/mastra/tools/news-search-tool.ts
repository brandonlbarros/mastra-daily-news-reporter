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

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    const { results } = await exa.search<{ text: true }>(inputData.query, {
      startPublishedDate: since24h,
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