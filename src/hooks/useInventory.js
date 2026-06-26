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

  function addProduct(product) {
    const newProduct = {
      ...product,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }
    setProducts(prev => [newProduct, ...prev])
  }

  function editProduct(id, updates) {
    setProducts(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    )
  }

  function deleteProduct(id) {
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  return { products, addProduct, editProduct, deleteProduct }
}