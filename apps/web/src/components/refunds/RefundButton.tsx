'use client';

import { useState, useCallback } from 'react';
import { RefundModal } from './RefundModal';
import { useRouter } from 'next/navigation';

interface RefundButtonProps {
  transactionId: string;
  maxAmountCents: number;
  currency: string;
}

export function RefundButton({ transactionId, maxAmountCents, currency }: RefundButtonProps) {
  const [open, setOpen] = useState(false);
  const router          = useRouter();

  const handleSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Issue Refund
      </button>
      <RefundModal
        open={open}
        onClose={() => setOpen(false)}
        transactionId={transactionId}
        maxAmountCents={maxAmountCents}
        currency={currency}
        onSuccess={handleSuccess}
      />
    </>
  );
}
