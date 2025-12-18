import { createState, computed, reactive, div, button, span, h2, h3, p, ul, li, strong, pre, code, type VNode } from 'elit';
import { codeBlock } from '../../highlight';

// Stock Management Demo Component
export const StockManagementDemo = () => {
  interface Product {
    id: number;
    name: string;
    quantity: number;
    price: number;
    category: 'Electronics' | 'Clothing' | 'Food' | 'Books';
    minStock: number;
  }

  const products = createState<Product[]>([
    { id: 1, name: 'Laptop', quantity: 15, price: 999, category: 'Electronics', minStock: 5 },
    { id: 2, name: 'T-Shirt', quantity: 50, price: 19.99, category: 'Clothing', minStock: 20 },
    { id: 3, name: 'Coffee Beans', quantity: 8, price: 12.99, category: 'Food', minStock: 10 },
    { id: 4, name: 'Novel', quantity: 25, price: 14.99, category: 'Books', minStock: 15 }
  ]);

  const selectedCategory = createState<'All' | 'Electronics' | 'Clothing' | 'Food' | 'Books'>('All');
  const searchQuery = createState('');
  const sortBy = createState<'name' | 'quantity' | 'price'>('name');

  // Add product form states
  const newProductName = createState('');
  const newProductQuantity = createState('');
  const newProductPrice = createState('');
  const newProductCategory = createState<'Electronics' | 'Clothing' | 'Food' | 'Books'>('Electronics');
  const newProductMinStock = createState('');
  const showAddForm = createState(false);

  let nextId = 5;

  // Computed state for filtered and sorted products
  const filteredProducts = computed([products, selectedCategory, searchQuery, sortBy], (productsList, category, query, sort) => {
    let filtered = productsList;

    // Filter by category
    if (category !== 'All') {
      filtered = filtered.filter(p => p.category === category);
    }

    // Filter by search query
    if (query.trim()) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'quantity':
          return b.quantity - a.quantity;
        case 'price':
          return b.price - a.price;
        default:
          return 0;
      }
    });
  });

  // Add new product
  const addProduct = () => {
    const name = newProductName.value.trim();
    const quantity = parseInt(newProductQuantity.value);
    const price = parseFloat(newProductPrice.value);
    const minStock = parseInt(newProductMinStock.value);

    if (name && !isNaN(quantity) && !isNaN(price) && !isNaN(minStock)) {
      products.value = [...products.value, {
        id: nextId++,
        name,
        quantity,
        price,
        category: newProductCategory.value,
        minStock
      }];

      // Clear form
      newProductName.value = '';
      newProductQuantity.value = '';
      newProductPrice.value = '';
      newProductCategory.value = 'Electronics';
      newProductMinStock.value = '';
      showAddForm.value = false;
    }
  };

  // Add stock
  const addStock = (productId: number, amount: number) => {
    products.value = products.value.map(p =>
      p.id === productId ? { ...p, quantity: p.quantity + amount } : p
    );
  };

  // Remove stock
  const removeStock = (productId: number, amount: number) => {
    products.value = products.value.map(p =>
      p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - amount) } : p
    );
  };

  // Delete product
  const deleteProduct = (productId: number) => {
    products.value = products.value.filter(p => p.id !== productId);
  };

  // Calculate statistics
  const totalProducts = () => products.value.length;
  const totalValue = () => products.value.reduce((sum, p) => sum + (p.quantity * p.price), 0);
  const lowStockCount = () => products.value.filter(p => p.quantity < p.minStock).length;
  const outOfStockCount = () => products.value.filter(p => p.quantity === 0).length;

  return div(
    // Add Product Button
    div({ style: 'margin-bottom: 1.5rem;' },
      reactive(showAddForm, (isShown) =>
        button({
          onclick: () => { showAddForm.value = !showAddForm.value; },
          style: `
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            border: none;
            background: var(--primary);
            color: white;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: opacity 0.2s;
          `
        }, isShown ? '✕ Cancel' : '➕ Add New Product')
      )
    ),

    // Add Product Form
    reactive(showAddForm, (isShown) =>
      isShown
        ? div({
            style: `
              background: var(--bg-card);
              border: 2px solid var(--primary);
              border-radius: 12px;
              padding: 1.5rem;
              margin-bottom: 1.5rem;
            `
          },
          div({ style: 'margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600; color: var(--primary);' }, '➕ Add New Product'),

          // Product Name
          div({ style: 'margin-bottom: 1rem;' },
            div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Product Name'),
            div({
              contentEditable: 'true',
              style: `
                padding: 0.75rem;
                border: 2px solid var(--border);
                border-radius: 8px;
                background: var(--bg);
                color: var(--text-primary);
                outline: none;
                min-height: 42px;
              `,
              oninput: (e: Event) => {
                newProductName.value = (e.target as HTMLElement).textContent || '';
              },
              'data-placeholder': newProductName.value ? '' : 'Enter product name...'
            })
          ),

          // Grid for Quantity, Price, Min Stock
          div({ style: 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;' },
            // Quantity
            div(
              div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Quantity'),
              div({
                contentEditable: 'true',
                style: `
                  padding: 0.75rem;
                  border: 2px solid var(--border);
                  border-radius: 8px;
                  background: var(--bg);
                  color: var(--text-primary);
                  outline: none;
                  min-height: 42px;
                `,
                oninput: (e: Event) => {
                  newProductQuantity.value = (e.target as HTMLElement).textContent || '';
                },
                'data-placeholder': newProductQuantity.value ? '' : '0'
              })
            ),

            // Price
            div(
              div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Price ($)'),
              div({
                contentEditable: 'true',
                style: `
                  padding: 0.75rem;
                  border: 2px solid var(--border);
                  border-radius: 8px;
                  background: var(--bg);
                  color: var(--text-primary);
                  outline: none;
                  min-height: 42px;
                `,
                oninput: (e: Event) => {
                  newProductPrice.value = (e.target as HTMLElement).textContent || '';
                },
                'data-placeholder': newProductPrice.value ? '' : '0.00'
              })
            ),

            // Min Stock
            div(
              div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Min Stock'),
              div({
                contentEditable: 'true',
                style: `
                  padding: 0.75rem;
                  border: 2px solid var(--border);
                  border-radius: 8px;
                  background: var(--bg);
                  color: var(--text-primary);
                  outline: none;
                  min-height: 42px;
                `,
                oninput: (e: Event) => {
                  newProductMinStock.value = (e.target as HTMLElement).textContent || '';
                },
                'data-placeholder': newProductMinStock.value ? '' : '0'
              })
            )
          ),

          // Category
          div({ style: 'margin-bottom: 1.5rem;' },
            div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Category'),
            reactive(newProductCategory, (selectedCat) =>
              div({ style: 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;' },
                ...(['Electronics', 'Clothing', 'Food', 'Books'] as const).map((category) =>
                  button({
                    onclick: () => { newProductCategory.value = category; },
                    style: `
                      padding: 0.75rem;
                      border-radius: 8px;
                      border: 2px solid ${selectedCat === category ? 'var(--primary)' : 'var(--border)'};
                      background: ${selectedCat === category ? 'var(--primary)' : 'var(--bg)'};
                      color: ${selectedCat === category ? 'white' : 'var(--text-primary)'};
                      cursor: pointer;
                      font-size: 0.875rem;
                      font-weight: 600;
                      transition: all 0.2s;
                    `
                  }, category)
                )
              )
            )
          ),

          // Submit Button
          button({
            onclick: addProduct,
            style: `
              width: 100%;
              padding: 0.875rem;
              border-radius: 8px;
              border: none;
              background: var(--primary);
              color: white;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: opacity 0.2s;
            `
          }, '✓ Add Product')
        )
        : null
    ),

    // Search and Filter Section
    div({ style: 'margin-bottom: 1.5rem;' },
      // Search
      div({ style: 'margin-bottom: 1rem;' },
        div({ style: 'position: relative;' },
          span({
            style: 'position: absolute; left: 12px; top: 50%; transform: translateY(-50%); font-size: 1.125rem; pointer-events: none;'
          }, '🔍'),
          div({
            contentEditable: 'true',
            style: `
              width: 100%;
              padding: 0.75rem 0.75rem 0.75rem 2.5rem;
              border: 2px solid var(--border);
              border-radius: 8px;
              background: var(--bg);
              color: var(--text-primary);
              font-size: 1rem;
              outline: none;
              min-height: 42px;
            `,
            oninput: (e: Event) => {
              searchQuery.value = (e.target as HTMLElement).textContent || '';
            },
            'data-placeholder': searchQuery.value ? '' : 'Search products...'
          })
        )
      ),

      // Category Filter & Sort
      div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
        reactive(selectedCategory, (cat: string) =>
          div({ style: 'display: flex; gap: 0.5rem; flex: 1; min-width: 300px;' },
            ...['All', 'Electronics', 'Clothing', 'Food', 'Books'].map((category) =>
              button({
                onclick: () => { selectedCategory.value = category as any; },
                style: `
                  flex: 1;
                  padding: 0.5rem;
                  border-radius: 6px;
                  border: 1px solid var(--border);
                  background: ${cat === category ? 'var(--primary)' : 'var(--bg)'};
                  color: ${cat === category ? 'white' : 'var(--text-primary)'};
                  cursor: pointer;
                  font-size: 0.875rem;
                  font-weight: 600;
                `
              }, category)
            )
          )
        ),
        reactive(sortBy, (sort: string) =>
          div({ style: 'display: flex; gap: 0.5rem;' },
            span({ style: 'display: flex; align-items: center; color: var(--text-muted); font-size: 0.875rem; padding: 0 0.5rem;' }, 'Sort:'),
            ...['name', 'quantity', 'price'].map((field) =>
              button({
                onclick: () => { sortBy.value = field as any; },
                style: `
                  padding: 0.5rem 1rem;
                  border-radius: 6px;
                  border: 1px solid var(--border);
                  background: ${sort === field ? 'var(--primary)' : 'var(--bg)'};
                  color: ${sort === field ? 'white' : 'var(--text-primary)'};
                  cursor: pointer;
                  font-size: 0.875rem;
                  font-weight: 600;
                  text-transform: capitalize;
                `
              }, field)
            )
          )
        )
      )
    ),

    // Statistics Cards
    reactive(products, () =>
      div({
        style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;'
      },
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: var(--primary);' }, String(totalProducts())),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'Products')
        ),
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: #22c55e;' }, `$${totalValue().toFixed(2)}`),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'Total Value')
        ),
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: #f59e0b;' }, String(lowStockCount())),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'Low Stock')
        ),
        div({ style: 'padding: 1rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; text-align: center;' },
          div({ style: 'font-size: 1.75rem; font-weight: bold; color: #ef4444;' }, String(outOfStockCount())),
          div({ style: 'font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;' }, 'Out of Stock')
        )
      )
    ),

    // Products Table
    reactive(filteredProducts, (filtered) => {
      return filtered.length === 0
              ? div({
                  style: 'text-align: center; padding: 3rem; color: var(--text-muted); background: var(--bg-card); border-radius: 8px; border: 1px dashed var(--border);'
                },
                  div({ style: 'font-size: 3rem; margin-bottom: 0.5rem;' }, '📦'),
                  div('No products found')
                )
              : div({ style: 'overflow-x: auto;' },
                  div({ style: 'min-width: 600px;' },
                    // Table Header
                    div({
                      style: `
                        display: grid;
                        grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
                        gap: 1rem;
                        padding: 0.75rem 1rem;
                        background: var(--bg-card);
                        border: 1px solid var(--border);
                        border-radius: 8px 8px 0 0;
                        font-weight: 600;
                        font-size: 0.875rem;
                        color: var(--text-muted);
                      `
                    },
                      div('Product'),
                      div('Category'),
                      div('Quantity'),
                      div('Price'),
                      div('Value'),
                      div('Actions')
                    ),

                    // Table Body
                    div({ style: 'display: flex; flex-direction: column;' },
                      ...filtered.map((product, index) => {
                        const isLowStock = product.quantity < product.minStock;
                        const isOutOfStock = product.quantity === 0;

                        return div({
                          style: `
                            display: grid;
                            grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
                            gap: 1rem;
                            padding: 1rem;
                            background: var(--bg-card);
                            border: 1px solid var(--border);
                            border-top: none;
                            ${index === filtered.length - 1 ? 'border-radius: 0 0 8px 8px;' : ''}
                            align-items: center;
                          `
                        },
                          // Product Name
                          div({ style: 'font-weight: 600;' }, product.name),

                          // Category
                          div(
                            span({
                              style: `
                                padding: 0.25rem 0.5rem;
                                border-radius: 4px;
                                background: var(--bg);
                                font-size: 0.75rem;
                                font-weight: 600;
                              `
                            }, product.category)
                          ),

                          // Quantity with status indicator
                          div({ style: 'display: flex; align-items: center; gap: 0.5rem;' },
                            span({
                              style: `
                                font-weight: 600;
                                color: ${isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : 'var(--text-primary)'};
                              `
                            }, String(product.quantity)),
                            isOutOfStock
                              ? span({ style: 'color: #ef4444; font-size: 0.75rem;' }, '⚠️')
                              : isLowStock
                              ? span({ style: 'color: #f59e0b; font-size: 0.75rem;' }, '⚠️')
                              : null
                          ),

                          // Price
                          div({ style: 'color: var(--text-muted);' }, `$${product.price.toFixed(2)}`),

                          // Total Value
                          div({ style: 'font-weight: 600; color: #22c55e;' }, `$${(product.quantity * product.price).toFixed(2)}`),

                          // Actions
                          div({ style: 'display: flex; gap: 0.25rem;' },
                            button({
                              onclick: () => addStock(product.id, 5),
                              style: `
                                padding: 0.25rem 0.5rem;
                                border-radius: 4px;
                                border: none;
                                background: #22c55e;
                                color: white;
                                cursor: pointer;
                                font-size: 0.875rem;
                                font-weight: 600;
                              `,
                              title: 'Add 5'
                            }, '+5'),
                            button({
                              onclick: () => removeStock(product.id, 5),
                              style: `
                                padding: 0.25rem 0.5rem;
                                border-radius: 4px;
                                border: none;
                                background: #f59e0b;
                                color: white;
                                cursor: pointer;
                                font-size: 0.875rem;
                                font-weight: 600;
                              `,
                              title: 'Remove 5'
                            }, '-5'),
                            button({
                              onclick: () => deleteProduct(product.id),
                              style: `
                                padding: 0.25rem 0.5rem;
                                border-radius: 4px;
                                border: none;
                                background: #ef4444;
                                color: white;
                                cursor: pointer;
                                font-size: 0.875rem;
                              `,
                              title: 'Delete'
                            }, '🗑️')
                          )
                        );
                      })
                    )
                  )
                );
    })
  );
};

// Stock Management source code
const stockStateExample = `import { createState, computed, reactive, div, button } from 'elit';

interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  category: 'Electronics' | 'Clothing' | 'Food' | 'Books';
  minStock: number;
}

// State
const products = createState<Product[]>([
  { id: 1, name: 'Laptop', quantity: 15, price: 999, category: 'Electronics', minStock: 5 },
  { id: 2, name: 'T-Shirt', quantity: 50, price: 19.99, category: 'Clothing', minStock: 20 }
]);

const selectedCategory = createState<'All' | 'Electronics' | 'Clothing' | 'Food' | 'Books'>('All');
const searchQuery = createState('');
const sortBy = createState<'name' | 'quantity' | 'price'>('name');

// Add product form states
const newProductName = createState('');
const newProductQuantity = createState('');
const newProductPrice = createState('');
const newProductCategory = createState<'Electronics' | 'Clothing' | 'Food' | 'Books'>('Electronics');
const newProductMinStock = createState('');
const showAddForm = createState(false);

// Add new product
const addProduct = () => {
  const name = newProductName.value.trim();
  const quantity = parseInt(newProductQuantity.value);
  const price = parseFloat(newProductPrice.value);
  const minStock = parseInt(newProductMinStock.value);

  if (name && !isNaN(quantity) && !isNaN(price) && !isNaN(minStock)) {
    products.value = [...products.value, {
      id: nextId++,
      name,
      quantity,
      price,
      category: newProductCategory.value,
      minStock
    }];

    // Clear form
    newProductName.value = '';
    newProductQuantity.value = '';
    newProductPrice.value = '';
    newProductCategory.value = 'Electronics';
    newProductMinStock.value = '';
    showAddForm.value = false;
  }
};

// Stock operations
const addStock = (productId: number, amount: number) => {
  products.value = products.value.map(p =>
    p.id === productId ? { ...p, quantity: p.quantity + amount } : p
  );
};

const removeStock = (productId: number, amount: number) => {
  products.value = products.value.map(p =>
    p.id === productId ? { ...p, quantity: Math.max(0, p.quantity - amount) } : p
  );
};`;

const stockFilterExample = `// Computed state for filtered and sorted products
// Automatically tracks products, selectedCategory, searchQuery, and sortBy
const filteredProducts = computed(
  [products, selectedCategory, searchQuery, sortBy],
  (productsList, category, query, sort) => {
    let filtered = productsList;

    // Filter by category
    if (category !== 'All') {
      filtered = filtered.filter(p => p.category === category);
    }

    // Filter by search query
    if (query.trim()) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'name': return a.name.localeCompare(b.name);
        case 'quantity': return b.quantity - a.quantity;
        case 'price': return b.price - a.price;
        default: return 0;
      }
    });
  }
);`;

const stockAddProductExample = `// Add Product Form with reactive toggle
reactive(showAddForm, (isShown) =>
  isShown
    ? div({
        style: 'background: var(--bg-card); border: 2px solid var(--primary); padding: 1.5rem;'
      },
      div({ style: 'margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600;' },
        '➕ Add New Product'
      ),

      // Product Name Input
      div({ style: 'margin-bottom: 1rem;' },
        div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;' },
          'Product Name'
        ),
        div({
          contentEditable: 'true',
          style: 'padding: 0.75rem; border: 2px solid var(--border); border-radius: 8px;',
          oninput: (e: Event) => {
            newProductName.value = (e.target as HTMLElement).textContent || '';
          },
          'data-placeholder': newProductName.value ? '' : 'Enter product name...'
        })
      ),

      // Category Selector
      div({ style: 'margin-bottom: 1.5rem;' },
        div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem;' },
          'Category'
        ),
        reactive(newProductCategory, (selectedCat) =>
          div({ style: 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;' },
            ...(['Electronics', 'Clothing', 'Food', 'Books'] as const).map((category) =>
              button({
                onclick: () => { newProductCategory.value = category; },
                style: \`
                  padding: 0.75rem;
                  border: 2px solid \${selectedCat === category ? 'var(--primary)' : 'var(--border)'};
                  background: \${selectedCat === category ? 'var(--primary)' : 'var(--bg)'};
                  color: \${selectedCat === category ? 'white' : 'var(--text-primary)'};
                \`
              }, category)
            )
          )
        )
      ),

      // Submit Button
      button({
        onclick: addProduct,
        style: 'width: 100%; padding: 0.875rem; background: var(--primary); color: white;'
      }, '✓ Add Product')
    )
    : null
);`;

const stockStatsExample = `// Calculate Statistics
const totalProducts = () => products.value.length;

const totalValue = () =>
  products.value.reduce((sum, p) => sum + (p.quantity * p.price), 0);

const lowStockCount = () =>
  products.value.filter(p => p.quantity < p.minStock).length;

const outOfStockCount = () =>
  products.value.filter(p => p.quantity === 0).length;

// Reactive rendering using computed state
// No need for nested reactive - computed handles all dependencies
reactive(filteredProducts, (filtered) => {
  return filtered.length === 0
    ? div({ style: 'text-align: center; padding: 3rem;' },
        div({ style: 'font-size: 3rem;' }, '📦'),
        div('No products found')
      )
    : div({ style: 'overflow-x: auto;' },
        // Render filtered and sorted products
        ...filtered.map(product =>
          div({ style: 'display: grid;' },
            div(product.name),
            div(product.quantity),
            div(\`$\${product.price.toFixed(2)}\`)
          )
        )
      );
});`;

// Stock Management Content
export const StockManagementContent: VNode = div(
  // Demo
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 2rem 0; font-size: 1.75rem;' }, '📦 Stock Management System'),
    StockManagementDemo()
  ),

  // Technical Overview
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🔧 Technical Implementation'),
    p({ style: 'color: var(--text-muted); margin-bottom: 2rem; line-height: 1.8;' },
      'This Stock Management System demonstrates complex state management, multiple filters, real-time statistics, ',
      'and dynamic sorting with Elit\'s reactive state system.'
    ),

    // Key Features
    div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;' },
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '➕ Add Products'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Interactive form to add new products with validation and instant updates'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🔍 Multi-Filter'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Combines category filtering, text search, and dynamic sorting in real-time'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '📊 Live Statistics'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Real-time calculations for total products, inventory value, and stock alerts'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '⚠️ Stock Alerts'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Automatic warnings for low stock and out-of-stock items with visual indicators'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🎯 Quick Actions'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Bulk stock adjustments and instant updates across all statistics'
        )
      )
    )
  ),

  // Source Code
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '💻 Source Code'),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '1. State & Operations'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(stockStateExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '2. Add Product Form'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(stockAddProductExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '3. Filtering & Sorting'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(stockFilterExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '4. Statistics & Rendering'),
    pre({ style: 'margin: 0;' }, code(...codeBlock(stockStatsExample)))
  ),

  // Key Learnings
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🎓 Key Learnings'),
    ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 2; color: var(--text-muted);' },
      li(strong('CRUD operations:'), ' Complete Create, Read, Update, Delete functionality with form validation'),
      li(strong('Form state management:'), ' Managing multiple form inputs with reactive state and validation'),
      li(strong('Conditional rendering:'), ' Toggle form visibility with reactive state (showAddForm)'),
      li(strong('Complex filtering:'), ' Combining multiple filter criteria with reactive updates'),
      li(strong('Computed state:'), ' Using computed() to track 4 dependencies (products, category, search, sort) automatically'),
      li(strong('Multiple dependencies:'), ' Tracking products, selectedCategory, searchQuery, and sortBy with computed([...], ...)'),
      li(strong('Dynamic sorting:'), ' Implementing multiple sort criteria with instant visual feedback'),
      li(strong('Input handling:'), ' Using oninput event without reactive wrapper to prevent typing issues'),
      li(strong('Conditional styling:'), ' Dynamic UI based on business rules (low stock alerts)'),
      li(strong('Bulk operations:'), ' Efficient state updates for multiple items'),
      li(strong('Data aggregation:'), ' Using reduce and filter for statistical calculations'),
      li(strong('Search implementation:'), ' Case-insensitive filtering with trim handling')
    )
  )
);
