/**
 * VietQR dynamic-image generation + payment-reference helpers.
 *
 * Uses SePay's public VietQR image API (https://developer.sepay.vn/en/tien-ich-khac/tao-qr-code):
 * https://vietqr.app/img?acc=...&bank=...&amount=...&des=...&template=...
 * It accepts a bank short-name/alias directly (no BIN lookup table needed).
 */

export interface BuildVietQrOptions {
  accountNumber: string;
  bankName: string;
  amount: number;
  content: string;
  accountHolder?: string | null;
  template?: string | null;
}

export function buildVietQrUrl(opts: BuildVietQrOptions): string {
  const params = new URLSearchParams({
    acc: opts.accountNumber,
    bank: opts.bankName,
    amount: String(Math.round(opts.amount)),
    des: opts.content,
    template: opts.template || 'compact',
  });
  if (opts.accountHolder) {
    params.set('holder', opts.accountHolder);
  }
  return `https://vietqr.app/img?${params.toString()}`;
}

/**
 * Short unique reference embedded in the bank-transfer content (des=), later used
 * to match an incoming SePay webhook `content` back to the pending Payment row.
 */
export function generatePaymentRef(): string {
  return 'FF' + Math.random().toString(36).slice(2, 10).toUpperCase();
}

/**
 * Maps a free-text paymentMethod coming from the client to the exact set of values
 * allowed by the `payments_method_check` DB constraint: CASH | QR | BANK_TRANSFER | CARD | OTHER.
 */
export function mapPaymentMethod(input?: string | null): string {
  switch ((input || '').toUpperCase()) {
    case 'CASH':
      return 'CASH';
    case 'VIETQR':
    case 'BANK_TRANSFER':
      return 'BANK_TRANSFER';
    case 'QR':
      return 'QR';
    case 'CREDIT_CARD':
    case 'CARD':
      return 'CARD';
    default:
      return input ? 'OTHER' : 'CASH';
  }
}

export function isVietQrMethod(input?: string | null): boolean {
  return (input || '').toUpperCase() === 'VIETQR';
}
