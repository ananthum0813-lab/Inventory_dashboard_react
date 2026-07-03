import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { formatINR } from '../utils/formatCurrency'

// Install recharts if not yet present: npm install recharts

const PALETTE = [
  '#7c6dfa', '#a99cf7', '#4ade80', '#fbbf24',
  '#f87171', '#34d399', '#60a5fa', '#f472b6', '#fb923c',
]

function StatCard({ label, value, color, icon, bar }) {
  return (
    <div className="analytics-stat-card">
      <div className="analytics-stat-card-bar" style={{ background: bar }} />
      <div className="analytics-stat-icon">{icon}</div>
      <span className="analytics-stat-label">{label}</span>
      <span className="analytics-stat-value" style={{ color }}>{value}</span>
    </div>
  )
}

function CustomTooltip({ active, payload, label, isValue }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-value" style={{ color: payload[0]?.fill }}>
        {isValue ? formatINR(payload[0].value) : `${payload[0].value} product${payload[0].value !== 1 ? 's' : ''}`}
      </div>
    </div>
  )
}

function AnalyticsDashboard({ products }) {
  const totalValue = useMemo(
    () => products.reduce((s, p) => s + Number(p.price) * Number(p.quantity), 0),
    [products]
  )
  const totalUnits = useMemo(
    () => products.reduce((s, p) => s + Number(p.quantity), 0),
    [products]
  )
  const outOfStockCount = useMemo(
    () => products.filter(p => Number(p.quantity) === 0).length,
    [products]
  )
  const lowStockProducts = useMemo(() =>
    products
      .filter(p => {
        const qty = Number(p.quantity)
        const thr = Number(p.lowStockThreshold) || 10
        return qty > 0 && qty <= thr
      })
      .sort((a, b) => {
        const ra = Number(a.quantity) / (Number(a.lowStockThreshold) || 10)
        const rb = Number(b.quantity) / (Number(b.lowStockThreshold) || 10)
        return ra - rb
      }),
    [products]
  )

  const categoryData = useMemo(() => {
    const map = {}
    products.forEach(p => {
      if (!map[p.category]) map[p.category] = { name: p.category, value: 0, count: 0 }
      map[p.category].value += Number(p.price) * Number(p.quantity)
      map[p.category].count += 1
    })
    return Object.values(map).sort((a, b) => b.value - a.value)
  }, [products])

  const uniqueCategories = useMemo(
    () => [...new Set(products.map(p => p.category))],
    [products]
  )

  if (products.length === 0) {
    return (
      <div className="empty-state" style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px' }}>
        <div className="empty-icon">📊</div>
        <p className="empty-text">No data yet</p>
        <p className="empty-sub">Add products to see analytics</p>
      </div>
    )
  }

  return (
    <div className="analytics-wrap">

      {/* ── Stat cards ── */}
      <div className="analytics-stats-grid">
        <StatCard label="Total Stock Value" value={formatINR(totalValue)} color="#fbbf24" icon="💰"
          bar="linear-gradient(90deg,#f59e0b,#d97706)" />
        <StatCard label="Total Products" value={products.length} color="#a99cf7" icon="📦"
          bar="linear-gradient(90deg,#7c6dfa,#5b4fcf)" />
        <StatCard label="Total Units" value={totalUnits.toLocaleString('en-IN')} color="#c4b5fd" icon="🔢"
          bar="linear-gradient(90deg,#8b5cf6,#7c3aed)" />
        <StatCard label="Categories" value={uniqueCategories.length} color="#34d399" icon="🏷"
          bar="linear-gradient(90deg,#10b981,#059669)" />
        <StatCard label="Low Stock" value={lowStockProducts.length} color="#fb923c" icon="⚠️"
          bar="linear-gradient(90deg,#f97316,#ea580c)" />
        <StatCard label="Out of Stock" value={outOfStockCount} color="#f87171" icon="🚫"
          bar="linear-gradient(90deg,#ef4444,#dc2626)" />
      </div>

      {/* ── Charts ── */}
      <div className="analytics-charts-grid">

        {/* Stock value by category */}
        <div className="analytics-chart-card">
          <div className="analytics-chart-title">Stock Value by Category</div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} margin={{ top: 8, right: 12, left: 0, bottom: 48 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#8a92b2', fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                />
                <YAxis
                  tick={{ fill: '#8a92b2', fontSize: 11 }}
                  tickFormatter={v => v >= 1000000 ? `₹${(v/1000000).toFixed(1)}M` : `₹${(v/1000).toFixed(0)}k`}
                  width={58}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip isValue />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={48}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p className="empty-sub">No category data</p>
            </div>
          )}
        </div>

        {/* Products per category */}
        <div className="analytics-chart-card">
          <div className="analytics-chart-title">Products by Category</div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryData} margin={{ top: 8, right: 12, left: 0, bottom: 48 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#8a92b2', fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                />
                <YAxis
                  tick={{ fill: '#8a92b2', fontSize: 11 }}
                  allowDecimals={false}
                  width={36}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip isValue={false} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={48}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[(i + 4) % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p className="empty-sub">No category data</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Low stock table ── */}
      {lowStockProducts.length > 0 && (
        <div className="section-card">
          <div className="table-header-row">
            <span className="table-header-label">
              ⚠️ Low Stock Products
              <span className="count-pill">{lowStockProducts.length}</span>
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Product', 'Category', 'Current Qty', 'Threshold', 'Stock Level'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(p => {
                  const qty = Number(p.quantity)
                  const thr = Number(p.lowStockThreshold) || 10
                  const pct = Math.round((qty / thr) * 100)
                  return (
                    <tr key={p.id} className="table-row">
                      <td className="table-td">
                        <div className="product-name">{p.name}</div>
                      </td>
                      <td className="table-td">
                        <span className="badge badge-category">{p.category}</span>
                      </td>
                      <td className="table-td">
                        <span className="qty-value" style={{ color: pct < 30 ? '#f87171' : '#fbbf24' }}>
                          {qty}
                        </span>
                      </td>
                      <td className="table-td">
                        <span style={{ color: '#8a92b2' }}>{thr}</span>
                      </td>
                      <td className="table-td">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '120px' }}>
                          <div className="cat-progress-track" style={{ flex: 1 }}>
                            <div
                              className="cat-progress-bar"
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                background: pct < 30
                                  ? 'linear-gradient(90deg,#ef4444,#dc2626)'
                                  : 'linear-gradient(90deg,#f97316,#ea580c)',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '12px', color: '#fbbf24', whiteSpace: 'nowrap', minWidth: '36px' }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Out-of-stock notice if any */}
      {outOfStockCount > 0 && (
        <div className="analytics-oos-notice">
          🚫 <strong>{outOfStockCount}</strong> product{outOfStockCount !== 1 ? 's are' : ' is'} out of stock and not shown in the low stock table above.
        </div>
      )}

    </div>
  )
}

export default AnalyticsDashboard