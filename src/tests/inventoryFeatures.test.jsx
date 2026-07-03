import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useEffect } from 'react'

import { useInventory } from '../hooks/useInventory'
import { exportToCSV } from '../utils/exportToCSV'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import StockHistoryModal from '../components/StockHistoryModal'

// Helper harness to expose hook API to tests
function HookHarness({ onReady }) {
  const api = useInventory()
  useEffect(() => { if (onReady) onReady(api) }, [api, onReady])
  return null
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('Inventory features — useInventory & utilities', () => {
  it('creates product with initial history (audit trail) and records edits', async () => {
    let api
    render(<HookHarness onReady={h => (api = h)} />)

    await act(async () => {
      api.addProduct({ name: 'X', category: 'C', quantity: 5, price: 10 })
    })

    expect(api.products.length).toBe(1)
    const p = api.products[0]
    expect(p.history).toBeDefined()
    expect(p.history[0].action).toBe('created')

    // edit quantity via editProduct should append an 'edit' history entry
    await act(async () => {
      api.editProduct(p.id, { quantity: 8 })
    })
    const updated = api.products.find(x => x.id === p.id)
    const last = updated.history[updated.history.length - 1]
    expect(last.action).toBe('edit')
    expect(last.previousQty).toBe(5)
    expect(last.newQty).toBe(8)
  })

  it('supports quick stock adjustment (stock-in and stock-out) and records history', async () => {
    let api
    render(<HookHarness onReady={h => (api = h)} />)

    await act(async () => api.addProduct({ name: 'Y', category: 'C', quantity: 10, price: 1 }))
    const p = api.products[0]

    await act(async () => api.adjustStock(p.id, 5, 'stock-in'))
    expect(api.products[0].quantity).toBe(15)
    expect(api.products[0].history.slice(-1)[0].action).toBe('stock-in')

    await act(async () => api.adjustStock(p.id, 3, 'stock-out'))
    expect(api.products[0].quantity).toBe(12)
    expect(api.products[0].history.slice(-1)[0].action).toBe('stock-out')
  })

  it('prevents duplicate products by name+category', async () => {
    let api
    render(<HookHarness onReady={h => (api = h)} />)

    await act(async () => api.addProduct({ name: 'DUP', category: 'C1', quantity: 1, price: 1 }))
    // adding duplicate should return false and not increase list
    let result
    await act(async () => { result = api.addProduct({ name: 'dup', category: 'c1', quantity: 2, price: 2 }) })
    // api.addProduct returns false on duplicate (implementation returns false)
    expect(result).toBe(false)
    expect(api.products.length).toBe(1)
  })

  it('applies bulk stock update and writes history for each product', async () => {
    let api
    render(<HookHarness onReady={h => (api = h)} />)

    await act(async () => {
      api.addProduct({ name: 'A', category: 'C', quantity: 10, price: 1 })
      api.addProduct({ name: 'B', category: 'C', quantity: 5, price: 1 })
    })
    const ids = api.products.map(p => p.id)

    await act(async () => api.bulkAdjustStock(ids, 2, 'stock-out'))

    const after = api.products
    expect(after.every(p => p.history.length >= 2)).toBe(true)
    expect(after.map(p => p.quantity).sort((a, b) => a - b)).toEqual([3, 8])
  })

  it('exportToCSV generates CSV and triggers download (DOM interactions mocked)', () => {
    // create simple product fixture
    const products = [
      { name: 'Prod', category: 'Cat', quantity: 2, price: 10, lowStockThreshold: 5, createdAt: new Date().toISOString() }
    ]

    const fakeUrl = 'blob:fake'
    const createSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => fakeUrl)
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    const clickSpy = vi.fn()
    const fakeAnchor = { href: '', download: '', click: clickSpy }
    const docCreateSpy = vi.spyOn(document, 'createElement').mockImplementation(() => fakeAnchor)

    exportToCSV(products)

    expect(createSpy).toHaveBeenCalled()
    expect(docCreateSpy).toHaveBeenCalledWith('a')
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeSpy).toHaveBeenCalled()
    createSpy.mockRestore()
    revokeSpy.mockRestore()
    docCreateSpy.mockRestore()
  })

  it('AnalyticsDashboard computes totals and low/out-of-stock correctly', () => {
    const products = [
      { id: 'p1', name: 'X', category: 'C1', quantity: 0, price: 100, lowStockThreshold: 5 },
      { id: 'p2', name: 'Y', category: 'C1', quantity: 3, price: 10, lowStockThreshold: 5 },
      { id: 'p3', name: 'Z', category: 'C2', quantity: 20, price: 2 },
    ]

    render(<AnalyticsDashboard products={products} />)

    // Total Products card
    expect(screen.getByText('Total Products')).toBeInTheDocument()
    const totalProductsCard = screen.getByText('Total Products').closest('.analytics-stat-card')
    expect(totalProductsCard).toBeTruthy()
    expect(totalProductsCard.textContent).toContain('3')

    // Low Stock should count only product with qty>0 and <= threshold => p2
    const lowCard = screen.getByText('Low Stock').closest('.analytics-stat-card')
    expect(lowCard.textContent).toContain('1')

    // Out of stock count
    const oosCard = screen.getByText('Out of Stock').closest('.analytics-stat-card')
    expect(oosCard.textContent).toContain('1')
  })

  it('StockHistoryModal renders history entries with formatted details', () => {
    const now = new Date().toISOString()
    const product = {
      id: 'hx', name: 'HistProd', category: 'C', quantity: 5,
      history: [ { id: 'h1', timestamp: now, previousQty: 0, newQty: 5, delta: 5, action: 'created' } ]
    }

    const onClose = vi.fn()
    render(<StockHistoryModal product={product} onClose={onClose} />)

    expect(screen.getByText('Stock History')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText(/0 → 5/)).toBeInTheDocument()
    expect(screen.getByText('+5')).toBeInTheDocument()
  })

})
