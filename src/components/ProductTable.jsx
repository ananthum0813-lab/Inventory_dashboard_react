import { useState } from 'react'
import { formatINR, formatINRDecimal } from '../utils/formatCurrency'
import StockHistoryModal from './StockHistoryModal'

const PAGE_SIZE = 10

function StockBadge({ quantity, threshold }) {
  if (quantity === 0) return <span className="badge badge-outofstock">🚫 Out of stock</span>
  if (threshold > 0 && quantity <= threshold) return <span className="badge badge-lowstock">⚠️ Low stock</span>
  return <span className="badge badge-instock">✅ In stock</span>
}

function StockAdjustControl({ product, onAdjustStock, onClose }) {
  const [type, setType] = useState('stock-in')
  const [amount, setAmount] = useState('')
  const [submitError, setSubmitError] = useState('')

  const currentQty = Number(product.quantity)
  const numAmt = Number(amount)

  // Inline validation
  const inputInvalid = amount !== '' && (!/^\d+$/.test(amount) || numAmt <= 0)
  const exceedsStock = type === 'stock-out' && amount !== '' && !inputInvalid && numAmt > currentQty

  function handleTypeChange(t) {
    setType(t)
    setSubmitError('')
  }

  function handleConfirm() {
    if (amount === '' || !/^\d+$/.test(amount) || numAmt <= 0) {
      setSubmitError('Enter a valid positive number.')
      return
    }
    if (type === 'stock-out' && numAmt > currentQty) {
      setSubmitError(`Only ${currentQty} unit${currentQty !== 1 ? 's' : ''} available.`)
      return
    }
    onAdjustStock(product.id, numAmt, type)
    onClose()
  }

  return (
    <div className="stock-adjust-wrap" onClick={e => e.stopPropagation()}>
      <div className="stock-adjust-toggle">
        <button
          type="button"
          className={`stock-adjust-type-btn ${type === 'stock-in' ? 'stock-adjust-type-active-in' : ''}`}
          onClick={() => handleTypeChange('stock-in')}
        >↑ In</button>
        <button
          type="button"
          className={`stock-adjust-type-btn ${type === 'stock-out' ? 'stock-adjust-type-active-out' : ''}`}
          onClick={() => handleTypeChange('stock-out')}
        >↓ Out</button>
      </div>

      <div className="stock-adjust-input-wrap">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Amount"
          value={amount}
          onChange={e => { setAmount(e.target.value.replace(/[^\d]/g, '')); setSubmitError('') }}
          className={`input-field stock-adjust-input ${(inputInvalid || exceedsStock || submitError) ? 'input-error' : ''}`}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onClose() }}
        />
        {exceedsStock && (
          <div className="stock-adjust-hint stock-adjust-hint-error">
            Max available: {currentQty}
          </div>
        )}
        {submitError && !exceedsStock && (
          <div className="stock-adjust-hint stock-adjust-hint-error">{submitError}</div>
        )}
      </div>

      <button type="button" className="btn-confirm" onClick={handleConfirm} style={{ flexShrink: 0 }}>✓</button>
      <button type="button" className="btn-ghost" onClick={onClose} style={{ flexShrink: 0 }}>✕</button>
    </div>
  )
}

function ProductTable({ products, onEdit, onDelete, onSort, sortKey, sortDir, onAdjustStock }) {
  const [confirmId, setConfirmId] = useState(null)
  const [page, setPage] = useState(1)
  const [adjustingId, setAdjustingId] = useState(null)
  const [historyProduct, setHistoryProduct] = useState(null)

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const paginated = products.slice(start, start + PAGE_SIZE)

  function handleDelete(id) {
    if (confirmId === id) { onDelete(id); setConfirmId(null) }
    else { setConfirmId(id); setTimeout(() => setConfirmId(c => c === id ? null : c), 4000) }
  }

  function goTo(p) { setPage(Math.max(1, Math.min(p, totalPages))) }

  function getPageNums() {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safePage - 1 && i <= safePage + 1)) {
        pages.push(i)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }

  const columns = [
    { key: 'name',     label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Qty' },
    { key: 'price',    label: 'Price' },
    { key: 'status',   label: 'Status',  noSort: true },
    { key: 'actions',  label: 'Actions', noSort: true },
  ]

  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📭</div>
        <p className="empty-text">No products found</p>
        <p className="empty-sub">Add a product or adjust your filters</p>
      </div>
    )
  }

  return (
    <>
      {historyProduct && (
        <StockHistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
      )}

      {/* Desktop table */}
      <div className="desktop-table">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`table-th ${!col.noSort ? 'table-th-sortable' : ''}`}
                  onClick={() => !col.noSort && onSort(col.key)}
                >
                  {col.label}
                  {!col.noSort && sortKey === col.key && (
                    <span className="sort-indicator">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(p => (
              <tr key={p.id} className="table-row">
                <td className="table-td">
                  <div className="product-name">{p.name}</div>
                  {p.description && <div className="product-desc">{p.description}</div>}
                </td>
                <td className="table-td">
                  <span className="badge badge-category">{p.category}</span>
                </td>
                <td className="table-td" style={{ minWidth: '140px' }}>
                  {adjustingId === p.id ? (
                    <StockAdjustControl
                      product={p}
                      onAdjustStock={onAdjustStock}
                      onClose={() => setAdjustingId(null)}
                    />
                  ) : (
                    <div className="qty-cell">
                      <span className="qty-value">{Number(p.quantity).toLocaleString('en-IN')}</span>
                      <button
                        type="button"
                        className="qty-adjust-trigger"
                        onClick={() => { setConfirmId(null); setAdjustingId(p.id) }}
                        title="Adjust stock"
                      >⇅</button>
                    </div>
                  )}
                </td>
                <td className="table-td">
                  <span className="price-value">{formatINRDecimal(p.price)}</span>
                  <div className="stock-value">val: {formatINR(Number(p.price) * Number(p.quantity))}</div>
                </td>
                <td className="table-td">
                  <StockBadge quantity={Number(p.quantity)} threshold={Number(p.lowStockThreshold)} />
                </td>
                <td className="table-td">
                  <div className="action-btns">
                    <button className="btn-edit" onClick={() => { setConfirmId(null); setAdjustingId(null); onEdit(p) }}>✏️ Edit</button>
                    <button className="btn-history" onClick={() => setHistoryProduct(p)} title="Stock history">🕓</button>
                    {confirmId === p.id ? (
                      <>
                        <button className="btn-confirm" onClick={() => handleDelete(p.id)}>Confirm</button>
                        <button className="btn-ghost" onClick={() => setConfirmId(null)}>✕</button>
                      </>
                    ) : (
                      <button className="btn-danger" onClick={() => handleDelete(p.id)}>🗑 Delete</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="mobile-cards">
        {paginated.map(p => (
          <div key={p.id} className="product-card">
            <div className="product-card-top">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="product-card-name">{p.name}</div>
                <span className="badge badge-category">{p.category}</span>
              </div>
              <StockBadge quantity={Number(p.quantity)} threshold={Number(p.lowStockThreshold)} />
            </div>

            {p.description && <p className="product-card-desc">{p.description}</p>}

            <div className="product-card-stats">
              <div className="product-card-stat">
                <span className="stat-label">Qty</span>
                <span className="stat-value">{Number(p.quantity).toLocaleString('en-IN')}</span>
              </div>
              <div className="product-card-stat">
                <span className="stat-label">Price</span>
                <span className="stat-value" style={{ color: '#fbbf24' }}>{formatINRDecimal(p.price)}</span>
              </div>
              <div className="product-card-stat">
                <span className="stat-label">Total Value</span>
                <span className="stat-value" style={{ color: '#c4b5fd' }}>
                  {formatINR(Number(p.price) * Number(p.quantity))}
                </span>
              </div>
            </div>

            {adjustingId === p.id ? (
              <StockAdjustControl
                product={p}
                onAdjustStock={onAdjustStock}
                onClose={() => setAdjustingId(null)}
              />
            ) : (
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '8px 14px', width: '100%', justifyContent: 'center', display: 'flex', gap: '6px' }}
                onClick={() => setAdjustingId(p.id)}
              >
                ⇅ Adjust Stock
              </button>
            )}

            <div className="product-card-actions">
              <button className="btn-edit" style={{ flex: 1 }} onClick={() => { setConfirmId(null); setAdjustingId(null); onEdit(p) }}>✏️ Edit</button>
              <button className="btn-history" onClick={() => setHistoryProduct(p)} title="Stock history">🕓</button>
              {confirmId === p.id ? (
                <>
                  <button className="btn-confirm" style={{ flex: 1 }} onClick={() => handleDelete(p.id)}>Confirm delete</button>
                  <button className="btn-ghost" onClick={() => setConfirmId(null)}>✕</button>
                </>
              ) : (
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(p.id)}>🗑 Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-left">
            <span className="pagination-info">
              {start + 1}–{Math.min(start + PAGE_SIZE, products.length)} of {products.length.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="pagination-right">
            <button className="page-btn" onClick={() => goTo(safePage - 1)} disabled={safePage === 1} aria-label="Previous page">←</button>
            {getPageNums().map((p, i) =>
              p === '...'
                ? <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
                : <button key={p} className={`page-btn ${p === safePage ? 'page-btn-active' : ''}`} onClick={() => goTo(p)}>{p}</button>
            )}
            <button className="page-btn" onClick={() => goTo(safePage + 1)} disabled={safePage === totalPages} aria-label="Next page">→</button>
          </div>
        </div>
      )}
    </>
  )
}

export default ProductTable