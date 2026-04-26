export function formatPrice(value: number, currency = "XOF") {
  return new Intl.NumberFormat("fr-SN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}
