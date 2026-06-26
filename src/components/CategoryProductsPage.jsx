import { useState, useMemo } from 'react'
import { formatINR, formatINRDecimal } from '../utils/formatCurrency'

const PAGE_SIZE = 10

function StockBadge({ quantity, threshold }) {
  if (quantity === 0) return <span className="badge badge-outofstock">🚫 Out of stock</span>
  if (threshold > 0 && quantity <= threshold) return <span className="badge badge-lowstock">⚠️ Low stock</span>
  return <span className="badge badge-instock">✅ In stock</span>
}

function CategoryProductsPage({ category, products, allProducts, onBack, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState('asc')
  const [view, setView] = useState('table')
  const [confirmId, setConfirmId] = useState(null)
  const [page, setPage] = useState(1)

  const totalPortfolioValue = useMemo(
    () => allProducts.reduce((s, p) => s + Number(p.price) * Number(p.quantity), 0),
    [allProducts]
  )

  const catProducts = useMemo(
    () => products.filter(p => p.category === category),
    [products, category]
  )

  const totalValue = useMemo(
    () => catProducts.reduce((s, p) => s + Number(p.price) * Number(p.quantity), 0),
    [catProducts]
  )
  const totalUnits = useMemo(
    () => catProducts.reduce((s, p) => s + Number(p.quantity), 0),
    [catProducts]
  )
  const lowStockCount = catProducts.filter(
    p => Number(p.quantity) > 0 && Number(p.lowStockThreshold) > 0 && Number(p.quantity) <= Number(p.lowStockThreshold)
  ).length
  const outOfStockCount = catProducts.filter(p => Number(p.quantity) === 0).length
  const pct = totalPortfolioValue > 0 ? (totalValue / totalPortfolioValue) * 100 : 0

  const filtered = useMemo(() => {
    let list = catProducts.filter(p => {
      const q = search.toLowerCase()
      return !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q)
    })
    list = [...list].sort((a, b) => {
      let av, bv
      if (sortKey === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase() }
      else if (sortKey === 'qty') { av = Number(a.quantity); bv = Number(b.quantity) }
      else if (sortKey === 'price') { av = Number(a.price); bv = Number(b.price) }
      else { av = Number(a.price) * Number(a.quantity); bv = Number(b.price) * Number(b.quantity) }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [catProducts, search, sortKey, sortDir])

  // Reset to page 1 when filter/sort changes
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const paginated = filtered.slice(start, start + PAGE_SIZE)

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc'); setPage(1) }
  }

  function handleSearch(val) {
    setSearch(val)
    setPage(1)
  }

  function handleDelete(id) {
    if (confirmId === id) { onDelete(id); setConfirmId(null) }
    else { setConfirmId(id); setTimeout(() => setConfirmId(c => c === id ? null : c), 4000) }
  }

  function goTo(p) {
    setPage(Math.max(1, Math.min(p, totalPages)))
  }

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
    { key: 'name',    label: 'Product' },
    { key: 'qty',     label: 'Qty' },
    { key: 'price',   label: 'Price' },
    { key: 'value',   label: 'Stock Value' },
    { key: 'status',  label: 'Status',  noSort: true },
    { key: 'actions', label: 'Actions', noSort: true },
  ]

  return (
    <div>
      {/* Back button */}
      <button
        className="btn-secondary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', marginBottom: '22px' }}
        onClick={onBack}
      >← Back to Categories</button>

      {/* Hero */}
      <div className="cat-hero">
        <div className="cat-hero-accent" />
        <div className="cat-hero-top">
          <div className="cat-hero-icon">🏷</div>
          <div style={{ flex: 1 }}>
            <div className="page-title">{category}</div>
            <div className="page-subtitle">
              {catProducts.length} product{catProducts.length !== 1 ? 's' : ''} · {formatINR(totalValue)} total value
            </div>
          </div>
          {(lowStockCount > 0 || outOfStockCount > 0) && (
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
              {outOfStockCount > 0 && <span className="badge badge-outofstock">{outOfStockCount} out</span>}
              {lowStockCount > 0 && <span className="badge badge-lowstock">{lowStockCount} low</span>}
            </div>
          )}
        </div>

        <div className="cat-hero-stats">
          {[
            { label: 'Products',    value: catProducts.length,                      color: '#a99cf7', bar: 'linear-gradient(90deg,#7c6dfa,#4f46e5)' },
            { label: 'Total Units', value: totalUnits.toLocaleString('en-IN'),       color: '#c4b5fd', bar: 'linear-gradient(90deg,#8b5cf6,#7c3aed)' },
            { label: 'Stock Value', value: formatINR(totalValue),                   color: '#fbbf24', bar: 'linear-gradient(90deg,#f59e0b,#d97706)' },
            { label: 'Portfolio %', value: pct.toFixed(1) + '%',                    color: '#34d399', bar: 'linear-gradient(90deg,#10b981,#059669)' },
          ].map(s => (
            <div key={s.label} className="cat-hero-stat">
              <div style={{ height: '2px', borderRadius: '2px', background: s.bar, marginBottom: '10px' }} />
              <div className="cat-hero-stat-label">{s.label}</div>
              <div className="cat-hero-stat-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="cat-progress-wrap">
          <div className="cat-progress-label">
            <span>Portfolio share</span>
            <span>{pct.toFixed(1)}%</span>
          </div>
          <div className="cat-progress-track">
            <div className="cat-progress-bar" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Products section */}
      <div className="section-card">

        {/* Toolbar */}
        <div className="cat-toolbar">
          <div className="cat-toolbar-search">
            <span className="cat-toolbar-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '36px', paddingRight: search ? '34px' : '14px' }}
            />
            {search && (
              <button
                className="search-clear-btn"
                onClick={() => handleSearch('')}
                aria-label="Clear search"
              >✕</button>
            )}
          </div>

          <div className="cat-toolbar-right">
            {filtered.length > 0 && (
              <span className="pagination-info" style={{ fontSize: '12px', color: '#2e3450' }}>
                {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
            )}
            <span className="count-pill">{filtered.length}</span>
            <div className="view-toggle">
              <button
                className={`view-toggle-btn ${view === 'table' ? 'view-toggle-btn-active' : ''}`}
                onClick={() => setView('table')} title="Table view"
              >☰</button>
              <button
                className={`view-toggle-btn ${view === 'cards' ? 'view-toggle-btn-active' : ''}`}
                onClick={() => setView('cards')} title="Card view"
              >⊞</button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p className="empty-text">No products found</p>
            <p className="empty-sub">
              {search ? 'Try a different search term' : 'No products in this category yet'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="cat-desktop-table" style={{ display: view === 'table' ? 'block' : 'none', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {columns.map(col => (
                      <th
                        key={col.key}
                        className={`table-th ${!col.noSort ? 'table-th-sortable' : ''}`}
                        onClick={() => !col.noSort && handleSort(col.key)}
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
                        <span className="qty-value">{Number(p.quantity).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="table-td">
                        <span className="price-value">{formatINRDecimal(p.price)}</span>
                      </td>
                      <td className="table-td">
                        <span className="price-value">{formatINR(Number(p.price) * Number(p.quantity))}</span>
                      </td>
                      <td className="table-td">
                        <StockBadge quantity={Number(p.quantity)} threshold={Number(p.lowStockThreshold)} />
                      </td>
                      <td className="table-td">
                        <div className="action-btns">
                          <button className="btn-edit" onClick={() => { setConfirmId(null); onEdit(p) }}>✏️ Edit</button>
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

            {/* Card grid view */}
            <div className="cat-mobile-cards" style={{ display: view === 'cards' ? 'block' : 'none' }}>
              <div className="product-card-grid">
                {paginated.map(p => (
                  <div key={p.id} className="product-grid-card">
                    <div className="product-grid-card-top">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="product-grid-card-name">{p.name}</div>
                        {p.description && <div className="product-grid-card-desc">{p.description}</div>}
                      </div>
                      <StockBadge quantity={Number(p.quantity)} threshold={Number(p.lowStockThreshold)} />
                    </div>
                    <div className="product-grid-card-stats">
                      <div className="product-grid-card-stat">
                        <span className="stat-label">Qty</span>
                        <span className="stat-value">{Number(p.quantity).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="product-grid-card-stat">
                        <span className="stat-label">Price</span>
                        <span className="stat-value" style={{ color: '#fbbf24' }}>{formatINRDecimal(p.price)}</span>
                      </div>
                      <div className="product-grid-card-stat">
                        <span className="stat-label">Value</span>
                        <span className="stat-value" style={{ color: '#c4b5fd' }}>
                          {formatINR(Number(p.price) * Number(p.quantity))}
                        </span>
                      </div>
                    </div>
                    <div className="product-grid-card-actions">
                      <button className="btn-edit" style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => { setConfirmId(null); onEdit(p) }}>✏️ Edit</button>
                      {confirmId === p.id ? (
                        <>
                          <button className="btn-confirm" style={{ flex: 1 }} onClick={() => handleDelete(p.id)}>Confirm delete</button>
                          <button className="btn-ghost" onClick={() => setConfirmId(null)}>✕</button>
                        </>
                      ) : (
                        <button className="btn-danger" style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => handleDelete(p.id)}>🗑 Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-left">
                  <span className="pagination-info">
                    {start + 1}–{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pagination-right">
                  <button
                    className="page-btn"
                    onClick={() => goTo(safePage - 1)}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                  >←</button>

                  {getPageNums().map((p, i) =>
                    p === '...'
                      ? <span key={`ellipsis-${i}`} className="page-ellipsis">…</span>
                      : <button
                          key={p}
                          className={`page-btn ${p === safePage ? 'page-btn-active' : ''}`}
                          onClick={() => goTo(p)}
                        >{p}</button>
                  )}

                  <button
                    className="page-btn"
                    onClick={() => goTo(safePage + 1)}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                  >→</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CategoryProductsPage