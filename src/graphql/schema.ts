import { makeExecutableSchema } from '@graphql-tools/schema';

import typeDefs from './typedefs.graphql';

import {
  enforceAccessControlTransformer,
  enforceAccessControlTypeDefs,
} from './directives/enforce-access-control';

const resolvers = {
  Query: {
    hello: () => 'world',
  },
  Mutation: {
    publish: () => 'allow publish',
    delete: () => 'allow delete',
    saveDraft: () => 'allow save',
  },
};

const schemaWithResolvers = makeExecutableSchema({
  resolvers,
  typeDefs: [enforceAccessControlTypeDefs, typeDefs],
});

const transformers: any[] = [enforceAccessControlTransformer];

export const schema = transformers.reduce(
  (curSchema, transformer) => transformer(curSchema),
  schemaWithResolvers,
);
