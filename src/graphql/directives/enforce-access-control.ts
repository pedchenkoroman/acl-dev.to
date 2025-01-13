import { defaultFieldResolver } from 'graphql/execution';
import { getDirective, MapperKind, mapSchema } from '@graphql-tools/utils';

import type { GraphQLSchema } from 'graphql/type';

/**
 * GraphQL directive to validate access to request field.
 */
const enforceAccessControl = (directiveName: string) => {
  return {
    // directive is a function with one argument
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
            // 1. Locate the Namespace
            const [namespaceActions] = context.action.split('|').filter((action) => {
              const namespace = action.split('/').at(0);
              return namespace === directive.namespace;
            });

            if (!namespaceActions) {
              throw new Error(`Namespace ${directive.namespace} does not exist!`);
            }

            // 2. Separate Namespace and Actions
            const [, allowedActions] = namespaceActions.split('/');

            // 3. Check Actions
            const isAllowedAction = allowedActions
              .split(',')
              .some((action) => ['*', info.fieldName].includes(action));

            if (isAllowedAction) {
              return resolve(source, args, context, info);
            }

            throw new Error(`The action ${info.fieldName} is not allowed!`);
          };

          return { ...fieldConfig, resolve: patchedResolve };
        },
      }),
  };
};

export const { enforceAccessControlTypeDefs, enforceAccessControlTransformer } =
  enforceAccessControl('enforceAccessControl');
