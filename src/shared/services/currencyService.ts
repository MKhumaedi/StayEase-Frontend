export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Base rate for future conversions
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'IDR', symbol: 'Rp', name: 'Rupiah (Rp)', rate: 1 }
];

export class CurrencyService {
  private currentCurrencyCode: string = 'IDR';

  constructor() {
    const saved = localStorage.getItem('stayease_currency');
    if (saved) {
      this.currentCurrencyCode = saved;
    }
  }

  getCurrentCurrency(): Currency {
    return SUPPORTED_CURRENCIES.find(c => c.code === this.currentCurrencyCode) || SUPPORTED_CURRENCIES[0];
  }

  setCurrency(code: string): void {
    const exists = SUPPORTED_CURRENCIES.some(c => c.code === code);
    if (exists) {
      this.currentCurrencyCode = code;
      localStorage.setItem('stayease_currency', code);
    }
  }

  format(value: number, code?: string): string {
    const selectedCode = code || this.currentCurrencyCode;
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === selectedCode) || SUPPORTED_CURRENCIES[0];

    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

    return `${currency.symbol} ${formatted}`;
  }
}

export const currencyService = new CurrencyService();
