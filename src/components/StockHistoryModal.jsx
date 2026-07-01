import { useEffect } from 'react'

const ACTION_LABELS = {
  created:     { label: 'Created',   icon: '✨' },
  edit:        { label: 'Edited',    icon: '✏️' },
  'stock-in':  { label: 'Stock In',  icon: '↑' },
  'stock-out': { label: 'Stock Out', icon: '↓' },
}

function formatTimestamp(iso) {
  const d = new Date(iso)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function StockHistoryModal({ product, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!product) return null

  const history = [...(product.history || [])].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )

  return (
    <div className="history-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="history-modal" onClick={e => e.stopPropagation()}>

        <div className="history-modal-header">
          <div style={{ minWidth: 0 }}>
            <div className="history-modal-title">Stock History</div>
            <div className="history-modal-subtitle" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {product.name}
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose} aria-label="Close" style={{ flexShrink: 0 }}>✕</button>
        </div>

        <div className="history-modal-body">
          {history.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <div className="empty-icon">🕓</div>
              <p className="empty-text">No history yet</p>
            </div>
          ) : (
            <ul className="history-list">
              {history.map(entry => {
                const meta = ACTION_LABELS[entry.action] || { label: entry.action, icon: '•' }
                const isPositive = entry.delta > 0
                const isNegative = entry.delta < 0
                return (
                  <li key={entry.id} className="history-entry">
                    <div className="history-entry-icon">{meta.icon}</div>
                    <div className="history-entry-main">
                      <div className="history-entry-top">
                        <span className="history-entry-action">{meta.label}</span>
                        <span className={`history-entry-delta ${isPositive ? 'history-delta-pos' : ''} ${isNegative ? 'history-delta-neg' : ''}`}>
                          {isPositive ? '+' : ''}{entry.delta}
                        </span>
                      </div>
                      <div className="history-entry-detail">
                        {entry.previousQty} → {entry.newQty}
                      </div>
                      <div className="history-entry-time">{formatTimestamp(entry.timestamp)}</div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}

export default StockHistoryModal