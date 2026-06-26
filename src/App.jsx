import { useState, useMemo } from 'react'
import { useInventory } from './hooks/useInventory'
import { useToast } from './hooks/useToast'
import { exportToJSON } from './utils/exportToJSON'
import SummaryBar from './components/SummaryBar'
import SearchFilter from './components/SearchFilter'
import ProductForm from './components/ProductForm'
import ProductTable from './components/ProductTable'
import CategoryManager from './components/CategoryManager'
import Toast from './components/Toast'

const defaultFilters = { search: '', category: '', stockStatus: '', minQty: '', maxQty: '' }

function App() {
  const { products, addProduct, editProduct, deleteProduct } = useInventory()
  const { toasts, addToast, removeToast } = useToast()
  const [filters, setFilters] = useState(defaultFilters)
  const [editingProduct, setEditingProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('inventory')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')
  const [exportFlash, setExportFlash] = useState(false)

  const categories = useMemo(() =>
    [...new Set(products.map(p => p.category).filter(Boolean))].sort(),
    [products]
  )

  const filteredProducts = useMemo(() => {
    let list = products.filter(p => {
      const q = filters.search.toLowerCase()
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      const matchCategory = !filters.category || p.category === filters.category
      const qty = Number(p.quantity)
      const thr = Number(p.lowStockThreshold)
      const matchStock =
        filters.stockStatus === 'instock' ? qty > thr :
        filters.stockStatus === 'lowstock' ? qty > 0 && qty <= thr && thr > 0 :
        filters.stockStatus === 'outofstock' ? qty === 0 : true
      const matchMaxQty = filters.maxQty === '' || qty <= Number(filters.maxQty)
      return matchSearch && matchCategory && matchStock && matchMaxQty
    })

    list = [...list].sort((a, b) => {
      let aVal = a[sortKey]
      let bVal = b[sortKey]
      if (sortKey === 'quantity' || sortKey === 'price') {
        aVal = Number(aVal); bVal = Number(bVal)
      } else {
        aVal = String(aVal || '').toLowerCase()
        bVal = String(bVal || '').toLowerCase()
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [products, filters, sortKey, sortDir])

  const categorySummary = useMemo(() =>
    categories.map(cat => {
      const cp = products.filter(p => p.category === cat)
      return {
        name: cat,
        count: cp.length,
        totalQty: cp.reduce((s, p) => s + Number(p.quantity), 0),
        totalValue: cp.reduce((s, p) => s + Number(p.price) * Number(p.quantity), 0),
        lowStock: cp.filter(p => Number(p.quantity) > 0 && Number(p.lowStockThreshold) > 0 && Number(p.quantity) <= Number(p.lowStockThreshold)).length,
        outOfStock: cp.filter(p => Number(p.quantity) === 0).length,
      }
    }),
    [categories, products]
  )

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function handleSubmit(product) {
    if (editingProduct) {
      editProduct(editingProduct.id, product)
      addToast(`"${product.name}" updated successfully.`, 'success')
      setEditingProduct(null)
    } else {
      addProduct(product)
      addToast(`"${product.name}" added to inventory.`, 'success')
    }
    setShowForm(false)
  }

  function handleEdit(product) {
    setEditingProduct(product)
    setShowForm(true)
    setActiveTab('inventory')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancel() {
    setEditingProduct(null)
    setShowForm(false)
    if (editingProduct) addToast('Edit cancelled. No changes were saved.', 'info')
  }

  function handleDelete(id) {
    const product = products.find(p => p.id === id)
    deleteProduct(id)
    if (product) addToast(`"${product.name}" deleted from inventory.`, 'error')
  }

  function handleAddNew() {
    setEditingProduct(null)
    setShowForm(prev => editingProduct ? true : !prev)
  }

  function handleExport() {
    exportToJSON(products)
    setExportFlash(true)
    addToast(`${products.length} products exported as JSON.`, 'success')
    setTimeout(() => setExportFlash(false), 1500)
  }

  function handleFilterClick(stockStatus) {
    setFilters(f => ({ ...f, stockStatus: f.stockStatus === stockStatus ? '' : stockStatus }))
  }

  const tabs = [
    { id: 'inventory', label: 'Inventory', icon: '🗂' },
    { id: 'categories', label: 'Categories', icon: '🏷', badge: categories.length },
  ]

  return (
    <div className="app-shell">

      <Toast toasts={toasts} onRemove={removeToast} />

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="logo">
          <div className="logo-icon">📦</div>
          <span className="logo-text">Invent<span className="logo-dot">.</span>ory</span>
        </div>

        <div className="nav-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`nav-tab ${activeTab === t.id ? 'nav-tab-active' : ''}`}
              onClick={() => { setActiveTab(t.id); setMobileMenuOpen(false) }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {t.badge > 0 && <span className="nav-tab-badge">{t.badge}</span>}
            </button>
          ))}
        </div>

        <div className="nav-right">
          <span className="product-count">{products.length} products</span>
          <div className="nav-divider" />
          <button
            className={`export-btn ${exportFlash ? 'export-btn-flash' : ''}`}
            onClick={handleExport}
          >
            <span>↓</span>
            <span className="export-label">Export JSON</span>
          </button>
          <button
            className="hamburger"
            onClick={() => setMobileMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span className={`ham ${mobileMenuOpen ? 'ham-open' : ''}`} />
            <span className={`ham ${mobileMenuOpen ? 'ham-hidden' : ''}`} />
            <span className={`ham ${mobileMenuOpen ? 'ham-open ham-open-rev' : ''}`} />
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {mobileMenuOpen && (
        <div className="drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="logo-text">Invent<span className="logo-dot">.</span>ory</span>
              <button className="btn-ghost" onClick={() => setMobileMenuOpen(false)}>✕</button>
            </div>
            {tabs.map(t => (
              <button
                key={t.id}
                className={`drawer-item ${activeTab === t.id ? 'drawer-item-active' : ''}`}
                onClick={() => { setActiveTab(t.id); setMobileMenuOpen(false) }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {t.badge > 0 && <span className="nav-tab-badge" style={{ marginLeft: 'auto' }}>{t.badge}</span>}
              </button>
            ))}
            <div className="drawer-footer">
              <button
                className="export-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleExport}
              >↓ Export JSON</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page content ── */}
      <main className="page-content">

        {activeTab === 'inventory' && (
          <>
            <div className="page-header">
              <div>
                <h1 className="page-title">Inventory</h1>
                <p className="page-subtitle">
                  {products.length === 0
                    ? 'Add your first product to get started'
                    : `Managing ${products.length} product${products.length !== 1 ? 's' : ''}`}
                </p>
              </div>
              <button className="btn-primary" onClick={handleAddNew}>
                {showForm && !editingProduct ? '✕ Close' : '+ Add Product'}
              </button>
            </div>

            <SummaryBar products={products} onFilterClick={handleFilterClick} />

            {showForm && (
              <ProductForm
                initialData={editingProduct}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                categories={categories}
              />
            )}

            <div className="section-card" style={{ padding: '14px 16px', marginBottom: '16px' }}>
              <SearchFilter
                filters={filters}
                onFilterChange={setFilters}
                categories={categories}
                totalFiltered={filteredProducts.length}
                total={products.length}
              />
            </div>

            <div className="section-card">
              <div className="table-header-row">
                <span className="table-header-label">
                  Products
                  <span className="count-pill">{filteredProducts.length}</span>
                </span>
                <span style={{ fontSize: '12px', color: '#2a2f45' }}>
                  Sort: <strong style={{ color: '#4a5068' }}>{sortKey} {sortDir === 'asc' ? '↑' : '↓'}</strong>
                </span>
              </div>
              <ProductTable
                products={filteredProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSort={handleSort}
                sortKey={sortKey}
                sortDir={sortDir}
              />
            </div>
          </>
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            categorySummary={categorySummary}
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

      </main>

      {/* ── Mobile bottom bar ── */}
      <div className="mobile-bottom-bar">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`mobile-tab ${activeTab === t.id ? 'mobile-tab-active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            <span style={{ fontSize: '18px' }}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
        <button
          className="mobile-fab"
          onClick={() => { setActiveTab('inventory'); handleAddNew() }}
          aria-label="Add product"
        >+</button>
      </div>

    </div>
  )
}

export default App