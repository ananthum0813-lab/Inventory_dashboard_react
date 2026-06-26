import { useState, useEffect, useRef } from 'react'

const empty = { name: '', category: '', quantity: '', price: '', description: '' }

function Field({ label, name, required, hint, errors, touched, children }) {
  return (
    <div className="form-field">
      <label className="form-label">
        {label}
        {required && <span className="required-star">*</span>}
        {hint && <span className="form-label-hint">{hint}</span>}
      </label>
      {children}
      {errors[name] && touched[name] && (
        <p className="field-error" role="alert">⚠ {errors[name]}</p>
      )}
    </div>
  )
}

function ProductForm({ initialData, onSubmit, onCancel, categories = [] }) {
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [catOpen, setCatOpen] = useState(false)
  const catRef = useRef(null)
  const nameRef = useRef(null)

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        category: initialData.category || '',
        quantity: String(initialData.quantity ?? ''),
        price: String(initialData.price ?? ''),
        description: initialData.description || '',
      })
    } else {
      setForm(empty)
    }
    setErrors({})
    setTouched({})
    setTimeout(() => nameRef.current?.focus(), 50)
  }, [initialData])

  useEffect(() => {
    function handler(e) {
      if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function validate(data = form) {
    const e = {}

    // Name
    if (!data.name.trim()) {
      e.name = 'Product name is required.'
    } else if (data.name.trim().length < 2) {
      e.name = 'Name must be at least 2 characters.'
    } else if (data.name.trim().length > 100) {
      e.name = 'Name cannot exceed 100 characters.'
    } else if (!/^[a-zA-Z0-9 ]+$/.test(data.name.trim())) {
      e.name = 'Name must be alphanumeric — letters, numbers and spaces only. No special characters.'
    }

    // Category
    if (!data.category.trim()) {
      e.category = 'Category is required.'
    } else if (data.category.trim().length > 100) {
      e.category = 'Category cannot exceed 100 characters.'
    } else if (!/^[a-zA-Z0-9 ]+$/.test(data.category.trim())) {
      e.category = 'Category must be alphanumeric — letters, numbers and spaces only. No special characters.'
    }

    // Quantity
    if (data.quantity === '') {
      e.quantity = 'Quantity is required.'
    } else if (!/^\d+$/.test(data.quantity.trim())) {
      e.quantity = 'Quantity must be a whole number — no decimals or special characters.'
    } else if (parseInt(data.quantity, 10) < 0) {
      e.quantity = 'Quantity cannot be negative.'
    } else if (parseInt(data.quantity, 10) > 999999) {
      e.quantity = 'Quantity cannot exceed 9,99,999.'
    }

    // Price
    if (data.price === '') {
      e.price = 'Price is required.'
    } else if (isNaN(Number(data.price)) || Number(data.price) < 0) {
      e.price = 'Price must be a valid positive number.'
    } else if (Number(data.price) > 9999999) {
      e.price = 'Price cannot exceed ₹99,99,999.'
    }

    return e
  }

  function handleChange(e) {
    const { name, value } = e.target
    const updated = { ...form, [name]: value }
    setForm(updated)
    if (touched[name]) {
      const errs = validate(updated)
      setErrors(prev => ({ ...prev, [name]: errs[name] }))
    }
  }

  function handleBlur(e) {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const errs = validate()
    setErrors(prev => ({ ...prev, [name]: errs[name] }))
  }

  function handleCategoryBlur(e) {
    setTimeout(() => {
      setCatOpen(false)
      handleBlur(e)
    }, 150)
  }

  function handleQtyStep(delta) {
    const current = parseInt(form.quantity) || 0
    const next = Math.max(0, current + delta)
    const updated = { ...form, quantity: String(next) }
    setForm(updated)
    setTouched(prev => ({ ...prev, quantity: true }))
    const errs = validate(updated)
    setErrors(prev => ({ ...prev, quantity: errs.quantity }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const allTouched = Object.fromEntries(Object.keys(form).map(k => [k, true]))
    setTouched(allTouched)
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSubmit({
      name: form.name.trim(),
      category: form.category.trim(),
      quantity: parseInt(form.quantity, 10),
      price: parseFloat(Number(form.price).toFixed(2)),
      lowStockThreshold: 10,
      description: form.description.trim(),
    })
    setForm(empty)
    setErrors({})
    setTouched({})
  }

  const filteredCats = categories.filter(c =>
    c.toLowerCase().includes(form.category.toLowerCase()) && c !== form.category
  )

  return (
    <div className="form-card">
      <div className="form-title">
        <span className="form-title-icon">{initialData ? '✏️' : '➕'}</span>
        {initialData ? 'Edit Product' : 'Add New Product'}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">

          {/* Name */}
          <Field label="Product Name" name="name" required errors={errors} touched={touched}>
            <input
              ref={nameRef}
              name="name"
              type="text"
              placeholder="e.g. Laptop Pro X1"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`input-field ${errors.name && touched.name ? 'input-error' : ''}`}
              maxLength={100}
            />
            {!errors.name && (
              <p className="field-hint">Alphanumeric only · max 100 characters</p>
            )}
          </Field>

          {/* Category */}
          <Field label="Category" name="category" required errors={errors} touched={touched}>
            <div ref={catRef} style={{ position: 'relative' }}>
              <input
                name="category"
                type="text"
                placeholder="e.g. Electronics"
                value={form.category}
                onChange={e => { handleChange(e); setCatOpen(true) }}
                onFocus={() => setCatOpen(true)}
                onBlur={handleCategoryBlur}
                className={`input-field ${errors.category && touched.category ? 'input-error' : ''}`}
                autoComplete="off"
                maxLength={100}
              />
              {catOpen && filteredCats.length > 0 && (
                <div className="cat-dropdown">
                  {filteredCats.map(c => (
                    <button
                      key={c}
                      type="button"
                      className="cat-option"
                      onMouseDown={() => {
                        setForm(prev => ({ ...prev, category: c }))
                        setErrors(prev => { const n = { ...prev }; delete n.category; return n })
                        setCatOpen(false)
                      }}
                    >🏷 {c}</button>
                  ))}
                </div>
              )}
              {categories.length > 0 && (
                <div className="cat-chips">
                  {categories.slice(0, 6).map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`cat-chip ${form.category === c ? 'cat-chip-active' : ''}`}
                      onClick={() => {
                        setForm(prev => ({ ...prev, category: c }))
                        setErrors(prev => { const n = { ...prev }; delete n.category; return n })
                        setTouched(prev => ({ ...prev, category: true }))
                      }}
                    >{c}</button>
                  ))}
                </div>
              )}
            </div>
            {!errors.category && (
              <p className="field-hint">Alphanumeric only · max 100 characters</p>
            )}
          </Field>

          {/* Quantity */}
          <Field label="Quantity" name="quantity" required errors={errors} touched={touched}>
            <div className="qty-input-wrap">
              <button
                type="button"
                className="qty-btn"
                onClick={() => handleQtyStep(-1)}
                disabled={(parseInt(form.quantity) || 0) <= 0}
                aria-label="Decrease"
              >−</button>
              <input
                name="quantity"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                placeholder="0"
                value={form.quantity}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field qty-input ${errors.quantity && touched.quantity ? 'input-error' : ''}`}
              />
              <button
                type="button"
                className="qty-btn"
                onClick={() => handleQtyStep(1)}
                aria-label="Increase"
              >+</button>
            </div>
            {!errors.quantity && (
              <p className="field-hint">Whole numbers only · max 9,99,999</p>
            )}
          </Field>

          {/* Price */}
          <Field label="Price (₹)" name="price" required errors={errors} touched={touched}>
            <div style={{ position: 'relative' }}>
              <span className="price-prefix">₹</span>
              <input
                name="price"
                type="number"
                placeholder="0.00"
                value={form.price}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`input-field ${errors.price && touched.price ? 'input-error' : ''}`}
                style={{ paddingLeft: '26px' }}
                min="0"
                step="0.01"
              />
            </div>
            {!errors.price && (
              <p className="field-hint">In Indian Rupees · max ₹99,99,999</p>
            )}
          </Field>

        </div>

        {/* Description */}
        <div className="form-field" style={{ marginBottom: '18px' }}>
          <label className="form-label">
            Description <span className="form-label-hint">optional</span>
          </label>
          <textarea
            name="description"
            placeholder="Brief product notes..."
            value={form.description}
            onChange={handleChange}
            className="input-field"
            style={{ resize: 'vertical', minHeight: '64px', lineHeight: '1.5' }}
            maxLength={300}
          />
          <p className="field-hint">Max 300 characters · {300 - form.description.length} remaining</p>
        </div>

        <div className="divider" />
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {initialData ? '💾 Save Changes' : '✚ Add Product'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default ProductForm