import { ApolloServer } from '@apollo/server';
import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda';

import { schema } from '../graphql/schema';
import { parseJwt } from '../helpers/parseJWT';

// create Apollo server
const server = new ApolloServer({
  schema,
  introspection: true,
});

// Graphql lambda handler
export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventRequestHandler(),
  {
    context: async ({ event }) => {
      // parse JWT token
      const payload = parseJwt(event.headers.Authorization);

      // create a context with the action property
      return { action: payload['custom:action'] };
    },
  },
);
