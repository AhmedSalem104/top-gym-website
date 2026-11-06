import { challengeGateway } from '../../src/server/challenge-gateway.ts';
export default { fetch: (request: Request) => challengeGateway(request) };
