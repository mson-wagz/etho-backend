const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
};

export function getCurrencySymbol(currency: string): string {
  const normalized = currency.toUpperCase();
  return CURRENCY_SYMBOLS[normalized] ?? currency;
}
