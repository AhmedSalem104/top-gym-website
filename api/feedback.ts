import { readFeedbackConfig } from '../src/server/feedback/config.ts';
import { redisStore } from '../src/server/feedback/store.ts';
import { deliverFeedback } from '../src/server/feedback/delivery.ts';
import { createFeedbackHandler } from '../src/server/feedback/handler.ts';

const config = readFeedbackConfig();
const handler = createFeedbackHandler({
  config,
  store: config ? redisStore(config) : undefined,
  send: async (feedback, key) => {
    if (!config) throw new Error('unavailable');
    await deliverFeedback(config, feedback, key);
  },
});
export default { fetch: handler };
