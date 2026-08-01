// ---------------------------------------------------------------------------
// Shared currency formatting helpers for the reconciliation dashboard
// ---------------------------------------------------------------------------

export const formatBDT = (value: number): string =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    currencyDisplay: "symbol",
    maximumFractionDigits: 2,
  })
    .format(value)
    .replace("BDT", "৳");

export const formatCompactBDT = (value: number): string =>
  "৳" +
  new Intl.NumberFormat("en-BD", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
