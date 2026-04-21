import type { StandaloneServerContextFunctionArgument } from '@apollo/server/standalone';
import type { Logger } from 'pino';
import { PaymentAPI }  from './datasources/PaymentAPI.js';
import { MerchantAPI } from './datasources/MerchantAPI.js';
import { RefundAPI }   from './datasources/RefundAPI.js';
import { config }      from './config.js';
import { resolveUser, type AuthUser } from './auth/guards.js';

export interface GatewayContext {
  dataSources: {
    paymentAPI:  PaymentAPI;
    merchantAPI: MerchantAPI;
    refundAPI:   RefundAPI;
  };
  authToken:   string | null;
  currentUser: AuthUser | null; // null = unauthenticated
  logger:      Logger;
}

export function buildContext(logger: Logger) {
  return async ({ req }: StandaloneServerContextFunctionArgument): Promise<GatewayContext> => {
    const authHeader = req.headers.authorization ?? null;
    const authToken  = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    // Build a lightweight context to decode user before full context is ready
    const preCtx = { authToken, logger } as GatewayContext;
    const currentUser = resolveUser(preCtx);

    return {
      dataSources: {
        paymentAPI:  new PaymentAPI(config.PAYMENT_SERVICE_URL, logger, authToken),
        merchantAPI: new MerchantAPI(config.MERCHANT_SERVICE_URL, logger, authToken),
        refundAPI:   new RefundAPI(config.REFUND_SERVICE_URL, logger, authToken),
      },
      authToken,
      currentUser,
      logger,
    };
  };
}
