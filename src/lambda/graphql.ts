import { ApolloServer } from '@apollo/server';
import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda';

import { schema } from '../graphql/schema';
import { parseJwt } from '../helpers/parseJWT';

const server = new ApolloServer({
  schema,
  introspection: true,
});

export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventRequestHandler(),
  {
    context: async ({ event }) => {
      const payload = parseJwt(event.headers.Authorization);

      return { action: payload['custom:action'] };
    },
  },
);
