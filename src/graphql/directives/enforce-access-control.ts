import { defaultFieldResolver } from 'graphql/execution';
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';

import type { GraphQLSchema } from 'graphql/type';

/**
 * GraphQL directive to validate access to request field.
 */
const enforceAccessControl = (directiveName: string) => {
  return {
    enforceAccessControlTypeDefs: `directive @${directiveName}(namespace: String!) on FIELD_DEFINITION`,
    enforceAccessControlTransformer: (schema: GraphQLSchema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD](fieldConfig) {
          const [directive] = getDirective(schema, fieldConfig, directiveName) || [];
          if (!directive) return fieldConfig;

          const { resolve = defaultFieldResolver } = fieldConfig;

          const patchedResolve = async (
            source: any,
            args: any,
            context: { action: string },
            info: any,
          ) => {
            // ['article/*', 'users/*', ...]
            const [action] = context.action.split(',').filter((action) => {
              const namespace = action.split('/').at(0);
              return namespace === directive.namespace;
            });

            if (!action) {
              throw new Error(`Namespace ${directive.namespace} does not exist!`);
            }

            const [, ...allowedActions] = action.split('/');

            if (!allowedActions.some((action) => ['*', info.fieldName].includes(action))) {
              throw new Error(`The action ${info.fieldName} is not allowed!`);
            }

            return resolve(source, args, context, info);
          };

          return { ...fieldConfig, resolve: patchedResolve };
        },
      }),
  };
};

export const { enforceAccessControlTypeDefs, enforceAccessControlTransformer } =
  enforceAccessControl('enforceAccessControl');
