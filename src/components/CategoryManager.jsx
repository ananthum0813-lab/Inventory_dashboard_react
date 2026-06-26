import { useState } from 'react'
import { formatINR } from '../utils/formatCurrency'
import CategoryProductsPage from './CategoryProductsPage'

const PAGE_SIZE = 12

function CategoryManager({ categories, categorySummary, products, onEdit, onDelete }) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [page, setPage] = useState(1)

  if (selectedCategory) {
    return (
      <CategoryProductsPage
        category={selectedCategory}
        products={products}
        allProducts={products}
        onBack={() => setSelectedCategory(null)}
        onEdit={p => { setSelectedCategory(null); onEdit(p) }}
        onDelete={onDelete}
      />
    )
  }

  const totalValue = categorySummary.reduce((s, c) => s + c.totalValue, 0)

  if (categories.length === 0) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Categories</h1>
            <p className="page-subtitle">Organize your products by category</p>
          </div>
        </div>
        <div className="empty-state" style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px' }}>
          <div className="empty-icon">🏷</div>
          <p className="empty-text">No categories yet</p>
          <p className="empty-sub">Add products with a category name and they'll appear here</p>
        </div>
      </div>
    )
  }

  // Pagination
  const totalPages = Math.max(1, Math.ceil(categorySummary.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * PAGE_SIZE
  const paginated = categorySummary.slice(start, start + PAGE_SIZE)

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} · {formatINR(totalValue)} total value
          </p>
        </div>
        {totalPages > 1 && (
          <span className="pagination-info" style={{ fontSize: '13px', color: '#2e3450', alignSelf: 'center' }}>
            {start + 1}–{Math.min(start + PAGE_SIZE, categorySummary.length)} of {categorySummary.length}
          </span>
        )}
      </div>

      <div className="cat-grid">
        {paginated.map(cat => {
          const pct = totalValue > 0 ? (cat.totalValue / totalValue) * 100 : 0
          return (
            <div key={cat.name} className="cat-card">
              <div className="cat-card-top">
                <div className="cat-icon-wrap">🏷</div>
                <div style={{ flex: 1 }}>
                  <h3 className="cat-name">{cat.name}</h3>
                  <span className="cat-product-count">
                    {cat.count} product{cat.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="cat-alerts">
                  {cat.outOfStock > 0 && <span className="badge badge-outofstock">{cat.outOfStock} out</span>}
                  {cat.lowStock > 0 && <span className="badge badge-lowstock">{cat.lowStock} low</span>}
                </div>
              </div>

              <div className="cat-stats">
                <div className="cat-stat">
                  <span className="cat-stat-value">{cat.totalQty.toLocaleString('en-IN')}</span>
                  <span className="cat-stat-label">Units</span>
                </div>
                <div className="cat-stat-divider" />
                <div className="cat-stat">
                  <span className="cat-stat-value" style={{ color: '#fbbf24' }}>
                    {formatINR(cat.totalValue)}
                  </span>
                  <span className="cat-stat-label">Stock Value</span>
                </div>
                <div className="cat-stat-divider" />
                <div className="cat-stat">
                  <span className="cat-stat-value" style={{ color: '#818cf8' }}>{pct.toFixed(1)}%</span>
                  <span className="cat-stat-label">Portfolio</span>
                </div>
              </div>

              <div>
                <div className="cat-progress-track">
                  <div className="cat-progress-bar" style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }} />
                </div>
              </div>

              <button className="cat-view-btn" onClick={() => setSelectedCategory(cat.name)}>
                View products →
              </button>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination" style={{ marginTop: '24px' }}>
          <div className="pagination-left">
            <span className="pagination-info">
              {start + 1}–{Math.min(start + PAGE_SIZE, categorySummary.length)} of {categorySummary.length} categories
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
    </div>
  )
}

export default CategoryManager