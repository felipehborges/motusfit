import { oc } from '@orpc/contract';
import { z } from 'zod';

export const healthContract = oc.route({ method: 'GET', path: '/health', tags: ['system'] }).output(
  z.object({
    status: z.literal('ok'),
    version: z.string(),
  }),
);
