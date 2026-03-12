import { createTool } from '@mastra/core/tools'
import z from 'zod'
import emailList from '../../emailList.json'

const EmailListEnum = z.enum(['climate', 'fintech', 'consumer', 'enterprise', 'health'])

export const getEmails = createTool({
  id: 'get-emails-tool',
  description: 'Retrieves a list of emails from the email list based on the specified category',
  inputSchema: z.object({
    category: EmailListEnum.describe(
      'The category of emails to retrieve: climate, fintech, consumer, enterprise, or health',
    ),
  }),
  outputSchema: z.object({
    category: EmailListEnum,
    emails: z.array(z.string()),
  }),
  execute: async ({ category }) => {
    const emails = emailList[category as keyof typeof emailList]
    return { category, emails }
  },
})
