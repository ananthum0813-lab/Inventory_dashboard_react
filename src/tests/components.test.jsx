/**
 * Inventory Dashboard — Component Tests
 *
 * Setup: install deps first:
 *   npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
 *
 * Add to vite.config.js:
 *   test: { globals: true, environment: 'jsdom', setupFiles: './src/__tests__/setup.js' }
 *
 * Run:
 *   npx vitest run
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ── Components ────────────────────────────────────────────────────────────────
import SummaryBar from '../components/SummaryBar'
import SearchFilter from '../components/SearchFilter'
import ProductForm from '../components/ProductForm'
import ProductTable from '../components/ProductTable'
import CategoryManager from '../components/CategoryManager'
import CategoryProductsPage from '../components/CategoryProductsPage'
import Toast from '../components/Toast'

// ── Fixtures ──────────────────────────────────────────────────────────────────
const makeProduct = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: 'Test Widget',
  category: 'Electronics',
  quantity: 50,
  price: 999,
  lowStockThreshold: 10,
  description: 'A test product',
  createdAt: new Date().toISOString(),
  ...overrides,
})

const PRODUCTS = [
  makeProduct({ id: 'p1', name: 'Laptop',   quantity: 5,  price: 75000, category: 'Electronics' }),
  makeProduct({ id: 'p2', name: 'Keyboard', quantity: 0,  price: 2500,  category: 'Electronics' }),
  makeProduct({ id: 'p3', name: 'Desk',     quantity: 12, price: 8000,  category: 'Furniture',   lowStockThreshold: 5 }),
  makeProduct({ id: 'p4', name: 'Chair',    quantity: 3,  price: 5000,  category: 'Furniture',   lowStockThreshold: 5 }),
]

const CATEGORIES = ['Electronics', 'Furniture']

const defaultFilters = { search: '', category: '', stockStatus: '', minQty: '', maxQty: '' }

const noop = () => {}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE LOAD / MOUNT TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('Page Load — SummaryBar', () => {
  it('renders without crashing', () => {
    render(<SummaryBar products={PRODUCTS} onFilterClick={noop} />)
    expect(screen.getByText('Total Products')).toBeInTheDocument()
  })

  it('shows all 5 stat cards', () => {
    render(<SummaryBar products={PRODUCTS} onFilterClick={noop} />)
    expect(screen.getByText('Total Products')).toBeInTheDocument()
    expect(screen.getByText('Total Units')).toBeInTheDocument()
    expect(screen.getByText('Stock Value')).toBeInTheDocument()
    expect(screen.getByText('Low Stock')).toBeInTheDocument()
    expect(screen.getByText('Out of Stock')).toBeInTheDocument()
  })

  it('displays correct product count', () => {
    render(<SummaryBar products={PRODUCTS} onFilterClick={noop} />)
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('counts out-of-stock correctly', () => {
    render(<SummaryBar products={PRODUCTS} onFilterClick={noop} />)
    // Keyboard has qty=0
    const outCard = screen.getByText('Out of Stock').closest('.summary-card')
    expect(within(outCard).getByText('1')).toBeInTheDocument()
  })

  it('renders with empty product list', () => {
    render(<SummaryBar products={[]} onFilterClick={noop} />)
    expect(screen.getByText('Total Products')).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  SEARCH FILTER
// ══════════════════════════════════════════════════════════════════════════════

describe('Page Load — SearchFilter', () => {
  it('renders search input', () => {
    render(
      <SearchFilter
        filters={defaultFilters}
        onFilterChange={noop}
        categories={CATEGORIES}
        totalFiltered={4}
        total={4}
      />
    )
    expect(screen.getByPlaceholderText(/search by name/i)).toBeInTheDocument()
  })

  it('renders category dropdown with options', () => {
    render(
      <SearchFilter
        filters={defaultFilters}
        onFilterChange={noop}
        categories={CATEGORIES}
        totalFiltered={4}
        total={4}
      />
    )
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('Furniture')).toBeInTheDocument()
  })

  it('shows active filter summary when search is active', () => {
    render(
      <SearchFilter
        filters={{ ...defaultFilters, search: 'laptop' }}
        onFilterChange={noop}
        categories={CATEGORIES}
        totalFiltered={1}
        total={4}
      />
    )
    expect(screen.getByText(/showing/i)).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('calls onFilterChange when typing in search', async () => {
    const handler = vi.fn()
    render(
      <SearchFilter
        filters={defaultFilters}
        onFilterChange={handler}
        categories={CATEGORIES}
        totalFiltered={4}
        total={4}
      />
    )
    await userEvent.type(screen.getByPlaceholderText(/search by name/i), 'L')
    expect(handler).toHaveBeenCalled()
  })

  it('shows clear all button only when filters are active', () => {
    const { rerender } = render(
      <SearchFilter
        filters={defaultFilters}
        onFilterChange={noop}
        categories={CATEGORIES}
        totalFiltered={4}
        total={4}
      />
    )
    expect(screen.queryByText(/clear all/i)).not.toBeInTheDocument()

    rerender(
      <SearchFilter
        filters={{ ...defaultFilters, search: 'desk' }}
        onFilterChange={noop}
        categories={CATEGORIES}
        totalFiltered={1}
        total={4}
      />
    )
    expect(screen.getByText(/clear all/i)).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  PRODUCT TABLE
// ══════════════════════════════════════════════════════════════════════════════

describe('Page Load — ProductTable', () => {
  const tableProps = {
    products: PRODUCTS,
    onEdit: noop,
    onDelete: noop,
    onSort: noop,
    sortKey: 'name',
    sortDir: 'asc',
  }

  it('renders without crashing', () => {
    render(<ProductTable {...tableProps} />)
    expect(screen.getByText('Laptop')).toBeInTheDocument()
  })

  it('renders all column headers', () => {
    render(<ProductTable {...tableProps} />)
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(screen.getByText('Category')).toBeInTheDocument()
    expect(screen.getByText('Qty')).toBeInTheDocument()
    expect(screen.getByText('Price')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('shows empty state when no products', () => {
    render(<ProductTable {...tableProps} products={[]} />)
    expect(screen.getByText(/no products found/i)).toBeInTheDocument()
  })

  it('shows Out of stock badge for zero quantity', () => {
    render(<ProductTable {...tableProps} />)
    const badges = screen.getAllByText(/out of stock/i)
    expect(badges.length).toBeGreaterThan(0)
  })

  it('shows Edit and Delete buttons for each product', () => {
    render(<ProductTable {...tableProps} />)
    const editBtns = screen.getAllByText(/edit/i)
    expect(editBtns.length).toBe(PRODUCTS.length)
  })

  it('calls onEdit when Edit button is clicked', async () => {
    const onEdit = vi.fn()
    render(<ProductTable {...tableProps} onEdit={onEdit} />)
    await userEvent.click(screen.getAllByText(/edit/i)[0])
    expect(onEdit).toHaveBeenCalledWith(PRODUCTS[0])
  })

  it('shows pagination when more than 10 products', () => {
    const manyProducts = Array.from({ length: 15 }, (_, i) =>
      makeProduct({ id: `p${i}`, name: `Product ${i}`, category: 'Electronics' })
    )
    render(<ProductTable {...tableProps} products={manyProducts} />)
    expect(screen.getByLabelText(/next page/i)).toBeInTheDocument()
  })

  it('does not show pagination for fewer than 11 products', () => {
    render(<ProductTable {...tableProps} />)
    expect(screen.queryByLabelText(/next page/i)).not.toBeInTheDocument()
  })

  it('does not render a page size selector', () => {
    const manyProducts = Array.from({ length: 15 }, (_, i) =>
      makeProduct({ id: `p${i}`, name: `Product ${i}`, category: 'Electronics' })
    )
    render(<ProductTable {...tableProps} products={manyProducts} />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  PRODUCT FORM
// ══════════════════════════════════════════════════════════════════════════════

describe('Page Load — ProductForm', () => {
  it('renders add form with empty fields', () => {
    render(<ProductForm initialData={null} onSubmit={noop} onCancel={noop} categories={CATEGORIES} />)
    expect(screen.getByText(/add new product/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/laptop pro x1/i)).toBeInTheDocument()
  })

  it('renders edit form with pre-filled values', () => {
    render(<ProductForm initialData={PRODUCTS[0]} onSubmit={noop} onCancel={noop} categories={CATEGORIES} />)
    expect(screen.getByText(/edit product/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Laptop')).toBeInTheDocument()
  })

  it('shows validation error when submitting empty form', async () => {
    render(<ProductForm initialData={null} onSubmit={noop} onCancel={noop} categories={CATEGORIES} />)
    await userEvent.click(screen.getByText(/add product/i))
    expect(await screen.findByText(/product name is required/i)).toBeInTheDocument()
  })

  it('calls onSubmit with correct data', async () => {
    const onSubmit = vi.fn()
    render(<ProductForm initialData={null} onSubmit={onSubmit} onCancel={noop} categories={CATEGORIES} />)

    await userEvent.type(screen.getByPlaceholderText(/laptop pro x1/i), 'New Widget')
    await userEvent.type(screen.getByPlaceholderText(/electronics/i), 'Electronics')
    await userEvent.type(screen.getByPlaceholderText('0'), '20')
    await userEvent.type(screen.getByPlaceholderText('0.00'), '499')
    await userEvent.click(screen.getByText(/add product/i))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New Widget', category: 'Electronics', quantity: 20, price: 499 })
    )
  })

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn()
    render(<ProductForm initialData={null} onSubmit={noop} onCancel={onCancel} categories={CATEGORIES} />)
    await userEvent.click(screen.getByText(/cancel/i))
    expect(onCancel).toHaveBeenCalled()
  })

  it('renders category chips for existing categories', () => {
    render(<ProductForm initialData={null} onSubmit={noop} onCancel={noop} categories={CATEGORIES} />)
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('Furniture')).toBeInTheDocument()
  })

  it('shows alphanumeric validation error for special chars in name', async () => {
    render(<ProductForm initialData={null} onSubmit={noop} onCancel={noop} categories={[]} />)
    const nameInput = screen.getByPlaceholderText(/laptop pro x1/i)
    await userEvent.type(nameInput, 'Widget@!#')
    fireEvent.blur(nameInput)
    expect(await screen.findByText(/alphanumeric/i)).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  CATEGORY MANAGER
// ══════════════════════════════════════════════════════════════════════════════

describe('Page Load — CategoryManager', () => {
  const categorySummary = [
    { name: 'Electronics', count: 2, totalQty: 5,  totalValue: 377500, lowStock: 1, outOfStock: 1 },
    { name: 'Furniture',   count: 2, totalQty: 15, totalValue: 111000, lowStock: 1, outOfStock: 0 },
  ]

  it('renders page title', () => {
    render(
      <CategoryManager
        categories={CATEGORIES}
        categorySummary={categorySummary}
        products={PRODUCTS}
        onEdit={noop}
        onDelete={noop}
      />
    )
    expect(screen.getByText('Categories')).toBeInTheDocument()
  })

  it('renders a card for each category', () => {
    render(
      <CategoryManager
        categories={CATEGORIES}
        categorySummary={categorySummary}
        products={PRODUCTS}
        onEdit={noop}
        onDelete={noop}
      />
    )
    expect(screen.getByText('Electronics')).toBeInTheDocument()
    expect(screen.getByText('Furniture')).toBeInTheDocument()
  })

  it('shows empty state when no categories exist', () => {
    render(
      <CategoryManager
        categories={[]}
        categorySummary={[]}
        products={[]}
        onEdit={noop}
        onDelete={noop}
      />
    )
    expect(screen.getByText(/no categories yet/i)).toBeInTheDocument()
  })

  it('navigates into category when View products is clicked', async () => {
    render(
      <CategoryManager
        categories={CATEGORIES}
        categorySummary={categorySummary}
        products={PRODUCTS}
        onEdit={noop}
        onDelete={noop}
      />
    )
    const viewBtns = screen.getAllByText(/view products/i)
    await userEvent.click(viewBtns[0])
    expect(screen.getByText(/back to categories/i)).toBeInTheDocument()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  CATEGORY PRODUCTS PAGE
// ══════════════════════════════════════════════════════════════════════════════

describe('Page Load — CategoryProductsPage', () => {
  const catPageProps = {
    category: 'Electronics',
    products: PRODUCTS,
    allProducts: PRODUCTS,
    onBack: noop,
    onEdit: noop,
    onDelete: noop,
  }

  it('renders category name as heading', () => {
    render(<CategoryProductsPage {...catPageProps} />)
    expect(screen.getByText('Electronics')).toBeInTheDocument()
  })

  it('renders back button', () => {
    render(<CategoryProductsPage {...catPageProps} />)
    expect(screen.getByText(/back to categories/i)).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', async () => {
    const onBack = vi.fn()
    render(<CategoryProductsPage {...catPageProps} onBack={onBack} />)
    await userEvent.click(screen.getByText(/back to categories/i))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows correct product count in subtitle', () => {
    render(<CategoryProductsPage {...catPageProps} />)
    expect(screen.getByText(/2 products/i)).toBeInTheDocument()
  })

  it('renders hero stat cards (Products, Total Units, Stock Value, Portfolio %)', () => {
    render(<CategoryProductsPage {...catPageProps} />)
    expect(screen.getByText('Products')).toBeInTheDocument()
    expect(screen.getByText('Total Units')).toBeInTheDocument()
    expect(screen.getByText('Stock Value')).toBeInTheDocument()
    expect(screen.getByText('Portfolio %')).toBeInTheDocument()
  })

  it('renders products belonging to the category', () => {
    render(<CategoryProductsPage {...catPageProps} />)
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.getByText('Keyboard')).toBeInTheDocument()
  })

  it('does NOT render products from other categories', () => {
    render(<CategoryProductsPage {...catPageProps} />)
    expect(screen.queryByText('Desk')).not.toBeInTheDocument()
    expect(screen.queryByText('Chair')).not.toBeInTheDocument()
  })

  it('filters products by search term', async () => {
    render(<CategoryProductsPage {...catPageProps} />)
    await userEvent.type(screen.getByPlaceholderText(/search products/i), 'Laptop')
    expect(screen.getByText('Laptop')).toBeInTheDocument()
    expect(screen.queryByText('Keyboard')).not.toBeInTheDocument()
  })

  it('shows empty state for unmatched search', async () => {
    render(<CategoryProductsPage {...catPageProps} />)
    await userEvent.type(screen.getByPlaceholderText(/search products/i), 'ZZZZZZ')
    expect(screen.getByText(/no products found/i)).toBeInTheDocument()
  })

  it('renders table view and card view toggle buttons', () => {
    render(<CategoryProductsPage {...catPageProps} />)
    expect(screen.getByTitle(/table view/i)).toBeInTheDocument()
    expect(screen.getByTitle(/card view/i)).toBeInTheDocument()
  })

  it('shows pagination when more than 10 products in category', () => {
    const manyProducts = Array.from({ length: 15 }, (_, i) =>
      makeProduct({ id: `e${i}`, name: `Device ${i}`, category: 'Electronics' })
    )
    render(
      <CategoryProductsPage
        {...catPageProps}
        products={manyProducts}
        allProducts={manyProducts}
      />
    )
    expect(screen.getByLabelText(/next page/i)).toBeInTheDocument()
  })

  it('does NOT show pagination for fewer than 11 products', () => {
    render(<CategoryProductsPage {...catPageProps} />)
    expect(screen.queryByLabelText(/next page/i)).not.toBeInTheDocument()
  })

  it('does not render a page size selector', () => {
    const manyProducts = Array.from({ length: 15 }, (_, i) =>
      makeProduct({ id: `e${i}`, name: `Device ${i}`, category: 'Electronics' })
    )
    render(
      <CategoryProductsPage
        {...catPageProps}
        products={manyProducts}
        allProducts={manyProducts}
      />
    )
    // No per-page dropdown; page size is fixed at 10
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('resets to page 1 when search changes', async () => {
    const manyProducts = Array.from({ length: 15 }, (_, i) =>
      makeProduct({ id: `e${i}`, name: `Device ${i}`, category: 'Electronics' })
    )
    render(
      <CategoryProductsPage
        {...catPageProps}
        products={manyProducts}
        allProducts={manyProducts}
      />
    )
    // Go to page 2
    await userEvent.click(screen.getByLabelText(/next page/i))
    // Search
    await userEvent.type(screen.getByPlaceholderText(/search products/i), 'Device 1')
    // Should be back on page 1 (Previous page button disabled)
    expect(screen.getByLabelText(/previous page/i)).toBeDisabled()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════════════════════════════════

describe('Page Load — Toast', () => {
  const toasts = [
    { id: 1, message: 'Product added successfully.', type: 'success' },
    { id: 2, message: 'Product deleted.', type: 'error' },
  ]

  it('renders all toasts', () => {
    render(<Toast toasts={toasts} onRemove={noop} />)
    expect(screen.getByText('Product added successfully.')).toBeInTheDocument()
    expect(screen.getByText('Product deleted.')).toBeInTheDocument()
  })

  it('renders no toasts when list is empty', () => {
    const { container } = render(<Toast toasts={[]} onRemove={noop} />)
    expect(container.querySelector('.toast')).not.toBeInTheDocument()
  })

  it('calls onRemove when close button is clicked', async () => {
    const onRemove = vi.fn()
    render(<Toast toasts={[toasts[0]]} onRemove={onRemove} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onRemove).toHaveBeenCalledWith(1)
  })
})