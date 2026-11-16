import { describe, it, expect } from "vitest";
import { calculateFinancialSplit, formatMoney } from "../../src/lib/money/decimal";

describe("Financial Calculation Module", () => {
  it("calculates 15% platform commission and seller net share accurately for $20.00", () => {
    const split = calculateFinancialSplit(20.0, 0.15);

    expect(split.grossAmount.toFixed(2)).toBe("20.00");
    expect(split.commissionRate.toFixed(4)).toBe("0.1500");
    expect(split.commissionAmount.toFixed(2)).toBe("3.00");
    expect(split.sellerNetAmount.toFixed(2)).toBe("17.00");

    // Invariant: grossAmount == commissionAmount + sellerNetAmount
    expect(split.commissionAmount.plus(split.sellerNetAmount).toFixed(2)).toBe(split.grossAmount.toFixed(2));
  });

  it("handles fractional cents using standard HALF_UP rounding without penny leakage", () => {
    // $19.99 with 15% commission = 2.9985 -> rounds to 3.00
    // Net seller amount = 19.99 - 3.00 = 16.99
    const split = calculateFinancialSplit("19.99", "0.15");

    expect(split.commissionAmount.toFixed(2)).toBe("3.00");
    expect(split.sellerNetAmount.toFixed(2)).toBe("16.99");
    expect(split.commissionAmount.plus(split.sellerNetAmount).toFixed(2)).toBe("19.99");
  });

  it("calculates 10% commission on 350.00 ETB", () => {
    const split = calculateFinancialSplit(350, 0.1);
    expect(split.commissionAmount.toFixed(2)).toBe("35.00");
    expect(split.sellerNetAmount.toFixed(2)).toBe("315.00");
    expect(formatMoney(split.sellerNetAmount, "ETB")).toBe("315.00 ETB");
  });

  it("throws error when gross price is negative", () => {
    expect(() => calculateFinancialSplit(-10, 0.15)).toThrowError("Gross price cannot be negative");
  });

  it("throws error when commission rate is invalid", () => {
    expect(() => calculateFinancialSplit(10, 1.25)).toThrowError("Commission rate must be between 0.0000 and 1.0000");
  });
});
