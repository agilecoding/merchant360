import pino from 'pino';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { config }    from './config.js';
import { typeDefs }  from './schema/typeDefs.js';
import { resolvers } from './schema/resolvers.js';
import { buildContext } from './context.js';

const logger = pino({ name: 'graphql-gateway', level: config.LOG_LEVEL });

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    {
      async requestDidStart({ request }) {
        const start = Date.now();
        return {
          async willSendResponse({ response }) {
            logger.info(
              {
                operationName: request.operationName,
                durationMs:    Date.now() - start,
                errors: response.body.kind === 'single'
                  ? response.body.singleResult.errors?.length ?? 0
                  : 0,
              },
              'GraphQL request',
            );
          },
        };
      },
    },
  ],
});

async function startServer() {
  const { url } = await startStandaloneServer<import('./context.js').GatewayContext>(server, {
    listen:  { port: config.PORT },
    context: buildContext(logger),
  });

  logger.info({ url }, 'GraphQL Gateway ready');
}

startServer();

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');
  await server.stop();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — shutting down');
  server.stop().finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection — shutting down');
  server.stop().finally(() => process.exit(1));
});