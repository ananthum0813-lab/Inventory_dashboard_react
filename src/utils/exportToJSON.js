export function exportToJSON(products) {
  const data = {
    exportedAt: new Date().toISOString(),
    totalProducts: products.length,
    totalValueINR: products.reduce((s, p) => s + Number(p.price) * Number(p.quantity), 0),
    products,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `inventory-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}