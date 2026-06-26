export function formatINR(value) {
  return '₹' + Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function formatINRDecimal(value) {
  return '₹' + Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}