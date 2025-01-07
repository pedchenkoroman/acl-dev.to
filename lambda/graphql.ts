import { ApolloServer } from '@apollo/server';
import {
  startServerAndCreateLambdaHandler,
  handlers,
} from '@as-integrations/aws-lambda';

const typeDefs = `#graphql
  type Query {
    hello: String
  }
  
  type Mutation {
    publish: String
    delete: String
    saveDraft: String
  }
`;

const resolvers = {
  Query: {
    hello: () => 'world',
  },
  Mutation: {
    publish: () => 'world',
    delete: () => 'world',
    saveDraft: () => 'world',
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true
});

export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventRequestHandler()
)