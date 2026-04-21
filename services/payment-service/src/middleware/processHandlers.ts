import type { Logger } from 'pino';

export function registerProcessHandlers(logger: Logger, onShutdown: () => Promise<void>): void {
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception — shutting down');
    onShutdown().finally(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection — shutting down');
    onShutdown().finally(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received — shutting down');
    onShutdown().finally(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received — shutting down');
    onShutdown().finally(() => process.exit(0));
  });
}
