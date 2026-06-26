function MobileNav({ activeTab, onTabChange, onClose, categories, onExport }) {
  return (
    <div className="mobile-overlay" onClick={onClose}>
      <div className="mobile-menu" onClick={e => e.stopPropagation()}>
        <div className="mobile-menu-header">
          <span className="logo-text">
            Invent<span className="logo-dot">.</span>ory
          </span>
          <button className="mobile-close-btn" onClick={onClose}>✕</button>
        </div>
        <nav className="mobile-menu-nav">
          <button
            className={`mobile-menu-item ${activeTab === 'inventory' ? 'mobile-menu-item-active' : ''}`}
            onClick={() => onTabChange('inventory')}
          >
            <span className="mobile-menu-icon">🗂</span>
            <span>Inventory</span>
          </button>
          <button
            className={`mobile-menu-item ${activeTab === 'categories' ? 'mobile-menu-item-active' : ''}`}
            onClick={() => onTabChange('categories')}
          >
            <span className="mobile-menu-icon">🏷</span>
            <span>Categories</span>
            {categories.length > 0 && (
              <span className="nav-tab-badge" style={{ marginLeft: 'auto' }}>{categories.length}</span>
            )}
          </button>
        </nav>
        <div className="mobile-menu-footer">
          <button className="export-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={onExport}>
            ↓ Export JSON
          </button>
        </div>
      </div>
    </div>
  )
}

export default MobileNav