import { GraphQLScalarType, Kind, GraphQLError } from 'graphql';
import type { GatewayContext } from '../context.js';
import type { TransactionRecord } from '../datasources/PaymentAPI.js';
import { requireAuth, requireRole, requireMerchantScope } from '../auth/guards.js';

// ── DateTime scalar ────────────────────────────────────────────────────────────
const DateTimeScalar = new GraphQLScalarType({
  name:        'DateTime',
  description: 'ISO 8601 date-time string',
  serialize:    (v) => (v instanceof Date ? v.toISOString() : String(v)),
  parseValue:   (v) => new Date(String(v)),
  parseLiteral: (ast) => ast.kind === Kind.STRING ? new Date(ast.value) : null,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function metadataToKV(meta: Record<string, string> = {}) {
  return Object.entries(meta).map(([key, value]) => ({ key, value }));
}

function cleanFilter(filter: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!filter) return {};
  return Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== undefined && v !== null),
  );
}

// ── Resolvers ─────────────────────────────────────────────────────────────────
export const resolvers = {
  DateTime: DateTimeScalar,

  Query: {
    /**
     * transactions — admin, analyst: full access
     *               merchant: scoped to their own merchantId
     */
    async transactions(
      _: unknown,
      { filter }: { filter?: Record<string, unknown> },
      ctx: GatewayContext,
    ) {
      const { scopedFilter } = requireMerchantScope(ctx, cleanFilter(filter));
      const result = await ctx.dataSources.paymentAPI.listTransactions(scopedFilter);
      ctx.logger.debug({ total: result.meta.total, role: ctx.currentUser?.role }, 'transactions resolved');
      return {
        data:       result.data,
        total:      result.meta.total,
        page:       result.meta.page,
        pageSize:   result.meta.pageSize,
        totalPages: result.meta.totalPages,
      };
    },

    /**
     * transaction — admin, analyst: any transaction
     *              merchant: only their own
     */
    async transaction(
      _: unknown,
      { id }: { id: string },
      ctx: GatewayContext,
    ) {
      if (!id?.trim()) {
        throw new GraphQLError('id is required', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      const user = requireAuth(ctx);
      const tx   = await ctx.dataSources.paymentAPI.getTransaction(id);

      if (tx && user.role === 'merchant' && tx.merchantId !== user.merchantId) {
        throw new GraphQLError('Transaction not found', {
          extensions: { code: 'NOT_FOUND', http: { status: 404 } },
        });
      }
      return tx;
    },

    /**
     * merchants — admin: full list
     *            analyst: full list (read-only)
     *            merchant: not permitted
     */
    async merchants(
      _: unknown,
      { filter }: { filter?: Record<string, unknown> },
      ctx: GatewayContext,
    ) {
      requireRole(ctx, 'admin', 'analyst');
      const result = await ctx.dataSources.merchantAPI.listMerchants(cleanFilter(filter));
      ctx.logger.debug({ total: result.meta.total }, 'merchants resolved');
      return {
        data:       result.data,
        total:      result.meta.total,
        page:       result.meta.page,
        pageSize:   result.meta.pageSize,
        totalPages: result.meta.totalPages,
      };
    },

    /**
     * merchant — admin, analyst: any merchant
     *           merchant: only their own
     */
    async merchant(
      _: unknown,
      { id }: { id: string },
      ctx: GatewayContext,
    ) {
      if (!id?.trim()) {
        throw new GraphQLError('id is required', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      const user = requireAuth(ctx);

      if (user.role === 'merchant' && id !== user.merchantId) {
        throw new GraphQLError('Merchant not found', {
          extensions: { code: 'NOT_FOUND', http: { status: 404 } },
        });
      }
      return ctx.dataSources.merchantAPI.getMerchant(id);
    },
  },

  Mutation: {
    /**
     * refundTransaction — admin: any transaction
     *                    merchant: only their own transactions
     *                    analyst: not permitted
     */
    async refundTransaction(
      _: unknown,
      { input }: {
        input: {
          transactionId:  string;
          amount:         number;
          currency:       string;
          reason?:        string;
          idempotencyKey: string;
        };
      },
      ctx: GatewayContext,
    ) {
      const user = requireRole(ctx, 'admin', 'merchant');

      if (!input.transactionId?.trim()) {
        throw new GraphQLError('transactionId is required', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!Number.isInteger(input.amount) || input.amount <= 0) {
        throw new GraphQLError('amount must be a positive integer (minor currency units)', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!input.idempotencyKey?.trim()) {
        throw new GraphQLError('idempotencyKey is required', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      // Merchant-scoped: verify the transaction belongs to them
      if (user.role === 'merchant') {
        const tx = await ctx.dataSources.paymentAPI.getTransaction(input.transactionId);
        if (!tx || tx.merchantId !== user.merchantId) {
          throw new GraphQLError('Transaction not found', {
            extensions: { code: 'NOT_FOUND', http: { status: 404 } },
          });
        }
      }

      const refund = await ctx.dataSources.refundAPI.createRefund(input);
      ctx.logger.info(
        { refundId: refund.id, transactionId: input.transactionId, role: user.role },
        'refund created via GraphQL',
      );
      return refund;
    },
  },

  // ── Field resolvers ──────────────────────────────────────────────────────────

  Transaction: {
    metadata(parent: TransactionRecord) {
      return metadataToKV(parent.metadata);
    },

    async merchant(parent: TransactionRecord, _: unknown, ctx: GatewayContext) {
      // Merchants should not traverse to other merchants; only their own
      const user = ctx.currentUser;
      if (user?.role === 'merchant' && parent.merchantId !== user.merchantId) return null;
      return ctx.dataSources.merchantAPI.getMerchant(parent.merchantId);
    },

    async refunds(parent: TransactionRecord, _: unknown, ctx: GatewayContext) {
      // analysts: read-only — fine
      // merchants: scoped by transaction ownership (already enforced in parent resolver)
      requireAuth(ctx);
      return ctx.dataSources.refundAPI.listRefundsByTransaction(parent.id);
    },
  },
};
