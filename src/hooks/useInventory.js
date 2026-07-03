import { useState, useEffect } from 'react'

const STORAGE_KEY = 'inventory_data'

export function useInventory() {
  const [products, setProducts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
  }, [products])

  // ── Helpers ──────────────────────────────────────────────────────────────
  function makeHistoryEntry({ previousQty, newQty, action }) {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      previousQty,
      newQty,
      delta: newQty - previousQty,
      action,
    }
  }

  function isDuplicate(name, category, excludeId = null) {
    const nameNorm = name.trim().toLowerCase()
    const catNorm  = category.trim().toLowerCase()
    return products.some(p =>
      p.id !== excludeId &&
      p.name.trim().toLowerCase()     === nameNorm &&
      p.category.trim().toLowerCase() === catNorm
    )
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  function addProduct(product) {
    if (isDuplicate(product.name, product.category)) return false

    const quantity = Number(product.quantity)
    const newProduct = {
      ...product,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      history: [makeHistoryEntry({ previousQty: 0, newQty: quantity, action: 'created' })],
    }
    setProducts(prev => [newProduct, ...prev])
  }

  function editProduct(id, updates) {
    const target = products.find(p => p.id === id)
    if (!target) return

    const newName     = updates.name     !== undefined ? updates.name     : target.name
    const newCategory = updates.category !== undefined ? updates.category : target.category
    if (isDuplicate(newName, newCategory, id)) return false

    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p
        const oldQty = Number(p.quantity)
        const newQty = updates.quantity !== undefined ? Number(updates.quantity) : oldQty
        const updatedHistory = newQty !== oldQty
          ? [...(p.history || []), makeHistoryEntry({ previousQty: oldQty, newQty, action: 'edit' })]
          : (p.history || [])
        return { ...p, ...updates, history: updatedHistory, updatedAt: new Date().toISOString() }
      })
    )
  }

  function deleteProduct(id) {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  // ── Quick stock adjustment ────────────────────────────────────────────────
  function adjustStock(id, amount, type) {
    const amt = Number(amount)
    if (!amt || amt <= 0) return
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p
        const oldQty = Number(p.quantity)
        const newQty = type === 'stock-in'
          ? oldQty + amt
          : Math.max(0, oldQty - amt)
        return {
          ...p,
          quantity: newQty,
          history: [...(p.history || []), makeHistoryEntry({ previousQty: oldQty, newQty, action: type })],
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  // ── Bulk operations ───────────────────────────────────────────────────────
  function bulkUpdateCategory(ids, newCategory) {
    const idSet = new Set(ids)
    setProducts(prev =>
      prev.map(p =>
        idSet.has(p.id) ? { ...p, category: newCategory, updatedAt: new Date().toISOString() } : p
      )
    )
  }

  function bulkDelete(ids) {
    const idSet = new Set(ids)
    setProducts(prev => prev.filter(p => !idSet.has(p.id)))
  }

  return { products, addProduct, editProduct, deleteProduct, adjustStock, bulkUpdateCategory, bulkDelete }
}