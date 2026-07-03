export function exportToCSV(products) {
  function escapeCell(val) {
    const str = String(val ?? '')
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"`
      : str
  }

  const headers = [
    'Name', 'Category', 'Quantity', 'Price (₹)',
    'Low Stock Threshold', 'Stock Value (₹)', 'Status', 'Created At',
  ]

  const rows = products.map(p => {
    const qty       = Number(p.quantity)
    const price     = Number(p.price)
    const threshold = Number(p.lowStockThreshold) || 10
    const value     = qty * price
    const status    = qty === 0 ? 'Out of Stock' : qty <= threshold ? 'Low Stock' : 'In Stock'

    return [
      escapeCell(p.name),
      escapeCell(p.category),
      qty,
      price.toFixed(2),
      threshold,
      value.toFixed(2),
      status,
      escapeCell(p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : ''),
    ].join(',')
  })

  const csv  = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}