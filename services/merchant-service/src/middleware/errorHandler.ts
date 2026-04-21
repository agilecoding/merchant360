import type { Request, Response, NextFunction } from 'express';
import type { Logger } from 'pino';
import { isAppError } from './AppError.js';

export function errorHandler(logger: Logger) {
  return (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    const requestId = req.headers['x-request-id'];

    if (isAppError(err)) {
      if (err.statusCode >= 500) {
        logger.error({ err, requestId, code: err.code }, err.message);
      } else {
        logger.warn({ requestId, code: err.code, status: err.statusCode }, err.message);
      }
      res.status(err.statusCode).json({
        message: err.message,
        ...(err.code ? { code: err.code } : {}),
        requestId,
      });
      return;
    }

    logger.error({ err, requestId }, 'Unexpected error');
    res.status(500).json({ message: 'Internal server error', requestId });
  };
}
