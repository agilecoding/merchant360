import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from './config.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { registerProcessHandlers } from './middleware/processHandlers.js';
import { notificationsRouter } from './notifications/notifications.router.js';

const logger = pino({ name: 'notification-service', level: config.LOG_LEVEL });
const app    = express();

app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(requestId);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

app.use('/v1/notifications', notificationsRouter(logger));

// Must be last
app.use(errorHandler(logger));

async function start() {
  const server = app.listen(config.PORT, '0.0.0.0', () => {
    logger.info({ port: config.PORT }, 'notification-service listening');
  });

  registerProcessHandlers(logger, async () => {
    server.close();
  });
}

start();
