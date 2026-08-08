import { getUserPlan } from '@motusfit/auth';
import { requireAuth } from '../../context';
import { implementedContract } from '../../implemented';
import { findProfileByUserId, upsertProfile } from './identity.repository';

const os = implementedContract.identity;

export const identityRouter = {
  profile: {
    get: os.profile.get
      .use(requireAuth)
      .handler(({ context }) => findProfileByUserId(context.db, context.user.id)),
    upsert: os.profile.upsert
      .use(requireAuth)
      .handler(({ context, input }) => upsertProfile(context.db, context.user.id, input)),
  },
  billing: {
    getPlan: os.billing.getPlan.use(requireAuth).handler(async ({ context }) => ({
      plan: await getUserPlan(context.db, context.user.id),
    })),
  },
};
