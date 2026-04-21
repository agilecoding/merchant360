import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from './config.js';
import { connectDb, closeDb } from './db.js';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { registerProcessHandlers } from './middleware/processHandlers.js';
import { refundRouter } from './refunds/refund.router.js';

const logger = pino({ name: 'refund-service', level: config.LOG_LEVEL });
const app    = express();

app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(requestId);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'refund-service' });
});

app.use('/v1/refunds', refundRouter);

// Must be last
app.use(errorHandler(logger));

async function start() {
  try {
    await connectDb();
    logger.info('MongoDB connected');

    const server = app.listen(config.PORT, '0.0.0.0', () => {
      logger.info({ port: config.PORT }, 'refund-service listening');
    });

    registerProcessHandlers(logger, async () => {
      server.close();
      await closeDb();
    });
  } catch (err) {
    logger.fatal(err, 'Failed to start');
    process.exit(1);
  }
}

start();
