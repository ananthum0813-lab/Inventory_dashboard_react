function SearchFilter({ filters, onFilterChange, categories, totalFiltered, total }) {
  const hasFilters = filters.search || filters.category || filters.maxQty

  return (
    <div className="search-filter-wrap">

      {/* Row: search + category + max qty — all in one line on desktop */}
      <div className="search-filter-grid">

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or description..."
            value={filters.search}
            onChange={e => onFilterChange({ ...filters, search: e.target.value })}
            className="input-field"
            style={{ paddingLeft: '38px', paddingRight: filters.search ? '34px' : '14px' }}
          />
          {filters.search && (
            <button
              className="search-clear-btn"
              onClick={() => onFilterChange({ ...filters, search: '' })}
              aria-label="Clear search"
            >✕</button>
          )}
        </div>

        {/* Category */}
        <select
          value={filters.category}
          onChange={e => onFilterChange({ ...filters, category: e.target.value })}
          className="input-field"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Max quantity — no absolute clear btn, use inline approach */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Max qty"
            value={filters.maxQty}
            onChange={e => onFilterChange({ ...filters, maxQty: e.target.value })}
            className="input-field"
            min="0"
            style={{ flex: 1, minWidth: 0 }}
          />
          {filters.maxQty && (
            <button
              className="btn-ghost"
              onClick={() => onFilterChange({ ...filters, maxQty: '' })}
              aria-label="Clear max quantity"
              style={{ flexShrink: 0, padding: '8px 10px', fontSize: '13px', color: '#4a5068' }}
            >✕</button>
          )}
        </div>

      </div>

      {/* Active filter summary */}
      {hasFilters && (
        <div className="filter-status-row">
          <span className="filter-status-text">
            Showing <strong>{totalFiltered}</strong> of <strong>{total}</strong> products
          </span>
          <button
            className="clear-filters-btn"
            onClick={() => onFilterChange({ search: '', category: '', stockStatus: '', minQty: '', maxQty: '' })}
          >✕ Clear all</button>
        </div>
      )}

    </div>
  )
}

export default SearchFilter