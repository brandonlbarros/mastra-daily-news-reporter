import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().optional().describe("The user's name, used to sign outgoing emails"),
});
