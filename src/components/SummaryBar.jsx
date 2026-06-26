import { formatINR } from '../utils/formatCurrency'

function SummaryBar({ products, onFilterClick }) {
  const totalProducts = products.length
  const totalUnits = products.reduce((s, p) => s + Number(p.quantity), 0)
  const totalValue = products.reduce((s, p) => s + Number(p.price) * Number(p.quantity), 0)
  const lowStock = products.filter(
    p => Number(p.quantity) > 0 && Number(p.lowStockThreshold) > 0 && Number(p.quantity) <= Number(p.lowStockThreshold)
  ).length
  const outOfStock = products.filter(p => Number(p.quantity) === 0).length

  const cards = [
    {
      label: 'Total Products', value: totalProducts, icon: '📦',
      iconBg: 'rgba(124,109,250,0.15)', color: '#a99cf7',
      bar: 'linear-gradient(90deg,#7c6dfa,#5b4fcf)',
    },
    {
      label: 'Total Units', value: totalUnits.toLocaleString('en-IN'), icon: '🔢',
      iconBg: 'rgba(139,92,246,0.15)', color: '#c4b5fd',
      bar: 'linear-gradient(90deg,#8b5cf6,#7c3aed)',
    },
    {
      label: 'Stock Value', value: formatINR(totalValue), icon: '💰',
      iconBg: 'rgba(245,158,11,0.12)', color: '#fbbf24',
      bar: 'linear-gradient(90deg,#f59e0b,#d97706)',
    },
    {
      label: 'Low Stock', value: lowStock, icon: '⚠️',
      iconBg: 'rgba(245,158,11,0.12)', color: '#fbbf24',
      bar: 'linear-gradient(90deg,#f97316,#ea580c)',
      filter: 'lowstock', clickable: lowStock > 0,
    },
    {
      label: 'Out of Stock', value: outOfStock, icon: '🚫',
      iconBg: 'rgba(239,68,68,0.12)', color: '#f87171',
      bar: 'linear-gradient(90deg,#ef4444,#dc2626)',
      filter: 'outofstock', clickable: outOfStock > 0,
    },
  ]

  return (
    <div className="summary-bar">
      {cards.map(card => (
        <div
          key={card.label}
          className={`summary-card ${card.clickable ? 'summary-card-clickable' : ''}`}
          onClick={() => card.clickable && onFilterClick && onFilterClick(card.filter)}
          title={card.clickable ? `Click to filter by ${card.label}` : undefined}
        >
          <div className="summary-card-bar" style={{ background: card.bar }} />
          <div className="summary-icon" style={{ background: card.iconBg }}>{card.icon}</div>
          <span className="summary-label">{card.label}</span>
          <span className="summary-value" style={{ color: card.color }}>{card.value}</span>
          {card.clickable && <span className="summary-card-hint">click to filter →</span>}
        </div>
      ))}
    </div>
  )
}

export default SummaryBar