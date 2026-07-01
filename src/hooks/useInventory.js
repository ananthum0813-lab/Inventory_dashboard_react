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

  function addProduct(product) {
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
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p
        const oldQty = Number(p.quantity)
        const newQty = updates.quantity !== undefined ? Number(updates.quantity) : oldQty
        const history = p.history || []
        const updatedHistory = newQty !== oldQty
          ? [...history, makeHistoryEntry({ previousQty: oldQty, newQty, action: 'edit' })]
          : history
        return { ...p, ...updates, history: updatedHistory, updatedAt: new Date().toISOString() }
      })
    )
  }

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
        const history = p.history || []
        return {
          ...p,
          quantity: newQty,
          history: [...history, makeHistoryEntry({ previousQty: oldQty, newQty, action: type })],
          updatedAt: new Date().toISOString(),
        }
      })
    )
  }

  function deleteProduct(id) {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return { products, addProduct, editProduct, deleteProduct, adjustStock }
}