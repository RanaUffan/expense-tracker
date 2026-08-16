export const CATEGORIES = ['Food', 'Transport', 'Housing', 'Utilities', 'Entertainment', 'Health', 'Other'];
export const PAYMENT_METHODS = ['Cash', 'Card', 'Bank Transfer', 'Other'];

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
