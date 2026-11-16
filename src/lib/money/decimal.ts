import Decimal from "decimal.js";

// Configure Decimal.js for financial calculation defaults
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

export interface FinancialSplit {
  grossAmount: Decimal;
  commissionRate: Decimal;
  commissionAmount: Decimal;
  sellerNetAmount: Decimal;
}

/**
 * Calculates platform commission and net seller earnings safely using Decimal arithmetic.
 *
 * @param grossPrice - The selling price of the book
 * @param commissionRate - The platform commission rate (e.g., 0.1500 for 15%)
 * @returns FinancialSplit with exact 2-decimal rounded figures
 */
export function calculateFinancialSplit(
  grossPrice: number | string | Decimal,
  commissionRate: number | string | Decimal
): FinancialSplit {
  const gross = new Decimal(grossPrice);
  const rate = new Decimal(commissionRate);

  if (gross.isNegative()) {
    throw new Error("Gross price cannot be negative");
  }
  if (rate.isNegative() || rate.greaterThan(1)) {
    throw new Error("Commission rate must be between 0.0000 and 1.0000");
  }

  // Calculate commission amount rounded to 2 decimal places
  const commissionAmount = gross.times(rate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  
  // Calculate seller net amount as remainder: gross - commission
  // (Prevents penny discrepancies where gross != commission + net)
  const sellerNetAmount = gross.minus(commissionAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

  return {
    grossAmount: gross.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
    commissionRate: rate.toDecimalPlaces(4),
    commissionAmount,
    sellerNetAmount,
  };
}

/**
 * Formats a decimal amount into standard ISO currency string representation.
 */
export function formatMoney(amount: number | string | Decimal, currency = "ETB"): string {
  const d = new Decimal(amount);
  return `${d.toFixed(2)} ${currency}`;
}

