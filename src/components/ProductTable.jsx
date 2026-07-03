import { useState } from 'react'
import { formatINR, formatINRDecimal } from '../utils/formatCurrency'
import StockHistoryModal from './StockHistoryModal'

const PAGE_SIZE = 10

function StockBadge({ quantity, threshold }) {
  if (quantity === 0) return <span className="badge badge-outofstock">🚫 Out of stock</span>
  if (threshold > 0 && quantity <= threshold) return <span className="badge badge-lowstock">⚠️ Low stock</span>
  return <span className="badge badge-instock">✅ In stock</span>
}

// ── Inline stock adjust control (per-row) ────────────────────────────────────
function StockAdjustControl({ product, onAdjustStock, onClose }) {
  const [type, setType]               = useState('stock-in')
  const [amount, setAmount]           = useState('')
  const [submitError, setSubmitError] = useState('')

  const currentQty   = Number(product.quantity)
  const numAmt       = Number(amount)
  const inputInvalid = amount !== '' && (!/^\d+$/.test(amount) || numAmt <= 0)
  const exceedsStock = type === 'stock-out' && amount !== '' && !inputInvalid && numAmt > currentQty

  function handleTypeChange(t) { setType(t); setSubmitError('') }

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
        <button type="button"
          className={`stock-adjust-type-btn ${type === 'stock-in'  ? 'stock-adjust-type-active-in'  : ''}`}
          onClick={() => handleTypeChange('stock-in')}>↑ In</button>
        <button type="button"
          className={`stock-adjust-type-btn ${type === 'stock-out' ? 'stock-adjust-type-active-out' : ''}`}
          onClick={() => handleTypeChange('stock-out')}>↓ Out</button>
      </div>
      <div className="stock-adjust-input-wrap">
        <div className="stock-adjust-current">Current: <strong>{currentQty}</strong></div>
        <input
          type="text" inputMode="numeric" placeholder="Amount" value={amount}
          onChange={e => { setAmount(e.target.value.replace(/[^\d]/g, '')); setSubmitError('') }}
          className={`input-field stock-adjust-input ${(inputInvalid || exceedsStock || submitError) ? 'input-error' : ''}`}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); if (e.key === 'Escape') onClose() }}
        />
        {exceedsStock && <div className="stock-adjust-hint stock-adjust-hint-error">Max available: {currentQty}</div>}
        {submitError && !exceedsStock && <div className="stock-adjust-hint stock-adjust-hint-error">{submitError}</div>}
      </div>
      <button type="button" className="btn-confirm" onClick={handleConfirm} style={{ flexShrink: 0 }}>✓</button>
      <button type="button" className="btn-ghost"   onClick={onClose}       style={{ flexShrink: 0 }}>✕</button>
    </div>
  )
}

// ── Bulk action bar ──────────────────────────────────────────────────────────
// Both Price and Stock ops are "set to X for all selected" — no add/remove ambiguity.
function BulkBar({ selectedIds, categories, onBulkUpdateCategory, onBulkUpdatePrice, onBulkAdjustStock, onBulkDelete, onClear }) {
  const [activeOp, setActiveOp]         = useState('category') // 'category' | 'price' | 'stock'
  const [bulkCategory, setBulkCategory] = useState('')
  const [bulkPrice, setBulkPrice]       = useState('')
  const [stockAmount, setStockAmount]   = useState('')
  const [error, setError]               = useState('')

  function clearInputs() {
    setBulkCategory(''); setBulkPrice(''); setStockAmount(''); setError('')
  }

  function switchOp(op) { setActiveOp(op); setError('') }

  function handleApply() {
    const ids = [...selectedIds]
    if (activeOp === 'category') {
      if (!bulkCategory) { setError('Select a category.'); return }
      onBulkUpdateCategory(ids, bulkCategory)
      clearInputs(); onClear()
    } else if (activeOp === 'price') {
      const p = parseFloat(bulkPrice)
      if (!bulkPrice || isNaN(p) || p < 0) { setError('Enter a valid price.'); return }
      if (p > 9999999) { setError('Price cannot exceed ₹99,99,999.'); return }
      onBulkUpdatePrice(ids, p)
      clearInputs(); onClear()
    } else {
      const amt = Number(stockAmount)
      if (stockAmount === '' || isNaN(amt) || amt < 0) { setError('Enter a valid quantity.'); return }
      onBulkAdjustStock(ids, amt, 'set')
      clearInputs(); onClear()
    }
  }

  return (
    <div className="bulk-bar">
      {/* Count + operation tabs */}
      <div className="bulk-bar-top">
        <span className="bulk-bar-count">{selectedIds.size} selected</span>
        <div className="bulk-op-tabs">
          <button
            type="button"
            className={`bulk-op-tab ${activeOp === 'category' ? 'bulk-op-tab-active' : ''}`}
            onClick={() => switchOp('category')}>🏷 Category</button>
          <button
            type="button"
            className={`bulk-op-tab ${activeOp === 'price' ? 'bulk-op-tab-active' : ''}`}
            onClick={() => switchOp('price')}>₹ Price</button>
          <button
            type="button"
            className={`bulk-op-tab ${activeOp === 'stock' ? 'bulk-op-tab-active' : ''}`}
            onClick={() => switchOp('stock')}>⇅ Stock</button>
        </div>
        <button className="btn-ghost bulk-bar-clear" onClick={() => { clearInputs(); onClear() }}>✕ Clear</button>
      </div>

      {/* Operation controls */}
      <div className="bulk-bar-controls">

        {/* Category */}
        {activeOp === 'category' && (
          <select
            className="input-field bulk-input"
            value={bulkCategory}
            onChange={e => { setBulkCategory(e.target.value); setError('') }}
          >
            <option value="">Move to category…</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {/* Price — sets every selected product's price to this exact amount */}
        {activeOp === 'price' && (
          <div className="bulk-input-prefixed">
            <span className="price-prefix">₹</span>
            <input
              type="text" inputMode="decimal" placeholder="Set price to…"
              value={bulkPrice}
              onChange={e => {
                let v = e.target.value.replace(/[^0-9.]/g, '')
                const parts = v.split('.')
                if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
                if (parts[1]?.length > 2) v = parts[0] + '.' + parts[1].slice(0, 2)
                setBulkPrice(v); setError('')
              }}
              className={`input-field bulk-input ${error && activeOp === 'price' ? 'input-error' : ''}`}
              
            />
          </div>
        )}

        {/* Stock — sets every selected product's quantity to this exact amount */}
        {activeOp === 'stock' && (
          <input
            type="text" inputMode="numeric"
            placeholder="Set stock quantity to…"
            value={stockAmount}
            onChange={e => { setStockAmount(e.target.value.replace(/[^\d]/g, '')); setError('') }}
            className={`input-field bulk-input ${error && activeOp === 'stock' ? 'input-error' : ''}`}
          />
        )}

        <button
          type="button" className="btn-primary bulk-apply-btn"
          onClick={handleApply}
        >Apply</button>

        <button
          type="button" className="btn-danger bulk-delete-btn"
          onClick={() => { onBulkDelete([...selectedIds]); clearInputs(); onClear() }}
        >🗑 Delete all</button>
      </div>

      {error && <div className="bulk-bar-error">{error}</div>}
    </div>
  )
}

// ── Main table ───────────────────────────────────────────────────────────────
function ProductTable({
  products, onEdit, onDelete, onSort, sortKey, sortDir,
  onAdjustStock, categories = [],
  onBulkDelete, onBulkUpdateCategory, onBulkUpdatePrice, onBulkAdjustStock,
}) {
  const [confirmId, setConfirmId]         = useState(null)
  const [page, setPage]                   = useState(1)
  const [adjustingId, setAdjustingId]     = useState(null)
  const [historyProduct, setHistoryProduct] = useState(null)
  const [selectedIds, setSelectedIds]     = useState(new Set())

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const start      = (safePage - 1) * PAGE_SIZE
  const paginated  = products.slice(start, start + PAGE_SIZE)
  const pageIds    = paginated.map(p => p.id)
  const allPageSelected  = pageIds.length > 0 && pageIds.every(id => selectedIds.has(id))
  const somePageSelected = pageIds.some(id => selectedIds.has(id))

  function toggleSelectAll() {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allPageSelected) pageIds.forEach(id => next.delete(id))
      else pageIds.forEach(id => next.add(id))
      return next
    })
  }

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function clearSelection() { setSelectedIds(new Set()) }

  function handleDelete(id) {
    if (confirmId === id) { onDelete(id); setConfirmId(null) }
    else { setConfirmId(id); setTimeout(() => setConfirmId(c => c === id ? null : c), 4000) }
  }

  function goTo(p) { setPage(Math.max(1, Math.min(p, totalPages))) }

  function getPageNums() {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= safePage - 1 && i <= safePage + 1)) pages.push(i)
      else if (pages[pages.length - 1] !== '...') pages.push('...')
    }
    return pages
  }

  const columns = [
    { key: 'select',   label: '',         noSort: true },
    { key: 'name',     label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Qty' },
    { key: 'price',    label: 'Price' },
    { key: 'status',   label: 'Status',   noSort: true },
    { key: 'actions',  label: 'Actions',  noSort: true },
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

      {/* Bulk bar — shown when any rows are selected */}
      {selectedIds.size > 0 && (
        <BulkBar
          selectedIds={selectedIds}
          categories={categories}
          onBulkUpdateCategory={onBulkUpdateCategory}
          onBulkUpdatePrice={onBulkUpdatePrice}
          onBulkAdjustStock={onBulkAdjustStock}
          onBulkDelete={onBulkDelete}
          onClear={clearSelection}
        />
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
                  style={col.key === 'select' ? { width: '40px', padding: '13px 8px 13px 18px' } : {}}
                >
                  {col.key === 'select' ? (
                    <input type="checkbox" className="row-checkbox"
                      checked={allPageSelected}
                      ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected }}
                      onChange={toggleSelectAll}
                      aria-label="Select all on page"
                    />
                  ) : (
                    <>
                      {col.label}
                      {!col.noSort && sortKey === col.key && (
                        <span className="sort-indicator">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>
                      )}
                    </>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(p => (
              <tr key={p.id} className={`table-row ${selectedIds.has(p.id) ? 'table-row-selected' : ''}`}>
                <td className="table-td" style={{ padding: '15px 8px 15px 18px', width: '40px' }}>
                  <input type="checkbox" className="row-checkbox"
                    checked={selectedIds.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    aria-label={`Select ${p.name}`}
                  />
                </td>
                <td className="table-td">
                  <div className="product-name">{p.name}</div>
                  {p.description && <div className="product-desc">{p.description}</div>}
                </td>
                <td className="table-td">
                  <span className="badge badge-category">{p.category}</span>
                </td>
                <td className="table-td" style={{ minWidth: '150px' }}>
                  {adjustingId === p.id ? (
                    <StockAdjustControl product={p} onAdjustStock={onAdjustStock}
                      onClose={() => setAdjustingId(null)} />
                  ) : (
                    <div className="qty-cell">
                      <span className="qty-value">{Number(p.quantity).toLocaleString('en-IN')}</span>
                      <button type="button" className="qty-adjust-trigger"
                        onClick={() => { setConfirmId(null); setAdjustingId(p.id) }}
                        title="Adjust stock">⇅</button>
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
                    <button className="btn-edit"
                      onClick={() => { setConfirmId(null); setAdjustingId(null); onEdit(p) }}>✏️ Edit</button>
                    <button className="btn-history"
                      onClick={() => setHistoryProduct(p)} title="Stock history">🕓</button>
                    {confirmId === p.id ? (
                      <>
                        <button className="btn-confirm" onClick={() => handleDelete(p.id)}>Confirm</button>
                        <button className="btn-ghost"   onClick={() => setConfirmId(null)}>✕</button>
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
          <div key={p.id} className={`product-card ${selectedIds.has(p.id) ? 'product-card-selected' : ''}`}>
            <div className="product-card-top">
              <input type="checkbox" className="row-checkbox" style={{ flexShrink: 0, marginTop: '2px' }}
                checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} />
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
              <StockAdjustControl product={p} onAdjustStock={onAdjustStock}
                onClose={() => setAdjustingId(null)} />
            ) : (
              <button type="button" className="btn-secondary"
                style={{ fontSize: '13px', padding: '8px 14px', width: '100%', justifyContent: 'center', display: 'flex', gap: '6px' }}
                onClick={() => setAdjustingId(p.id)}>⇅ Adjust Stock</button>
            )}
            <div className="product-card-actions">
              <button className="btn-edit" style={{ flex: 1 }}
                onClick={() => { setConfirmId(null); setAdjustingId(null); onEdit(p) }}>✏️ Edit</button>
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