import { createState, computed, reactive, div, button, span, h2, h3, p, ul, li, strong, pre, code, type VNode } from 'elit';
import { codeBlock } from '../../highlight';

// POS System Demo Component
export const POSSystemDemo = () => {
  interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    stock: number;
  }

  interface CartItem {
    product: Product;
    quantity: number;
  }

  // Available products
  const products: Product[] = [
    { id: 1, name: 'Espresso', price: 3.50, category: 'Coffee', stock: 100 },
    { id: 2, name: 'Cappuccino', price: 4.50, category: 'Coffee', stock: 100 },
    { id: 3, name: 'Latte', price: 4.00, category: 'Coffee', stock: 100 },
    { id: 4, name: 'Americano', price: 3.00, category: 'Coffee', stock: 100 },
    { id: 5, name: 'Croissant', price: 3.50, category: 'Bakery', stock: 50 },
    { id: 6, name: 'Muffin', price: 3.00, category: 'Bakery', stock: 50 },
    { id: 7, name: 'Bagel', price: 2.50, category: 'Bakery', stock: 50 },
    { id: 8, name: 'Orange Juice', price: 4.00, category: 'Beverage', stock: 30 },
    { id: 9, name: 'Water', price: 1.50, category: 'Beverage', stock: 100 },
  ];

  // State
  const cart = createState<CartItem[]>([]);
  const selectedCategory = createState<string>('All');
  const searchQuery = createState('');
  const paymentAmount = createState('');

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Computed filtered products
  const filteredProducts = computed([selectedCategory, searchQuery], (category, query) => {
    let filtered = products;

    if (category !== 'All') {
      filtered = filtered.filter(p => p.category === category);
    }

    if (query.trim()) {
      const searchText = query.toLowerCase().trim();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchText));
    }

    return filtered;
  });

  // Computed cart totals
  const subtotal = computed([cart], (items) => {
    return items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  });

  const tax = computed([subtotal], (amount) => amount * 0.07); // 7% tax
  const total = computed([subtotal, tax], (sub, taxAmount) => sub + taxAmount);

  // Cart operations
  const addToCart = (product: Product) => {
    const existingItem = cart.value.find(item => item.product.id === product.id);

    if (existingItem) {
      cart.value = cart.value.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      cart.value = [...cart.value, { product, quantity: 1 }];
    }
  };

  const removeFromCart = (productId: number) => {
    cart.value = cart.value.filter(item => item.product.id !== productId);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      cart.value = cart.value.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      );
    }
  };

  const clearCart = () => {
    cart.value = [];
  };

  const processPayment = () => {
    const payment = parseFloat(paymentAmount.value);
    if (!isNaN(payment) && payment >= total.value) {
      const change = payment - total.value;
      alert(`Payment successful!\nChange: $${change.toFixed(2)}`);
      clearCart();
      paymentAmount.value = '';
    } else {
      alert('Invalid payment amount');
    }
  };

  return div(
    { style: 'display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem;' },

    // Left Side: Products
    div(
      // Search and Category Filter
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

        // Category Filter
        reactive(selectedCategory, (cat) =>
          div({ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' },
            ...categories.map((category) =>
              button({
                onclick: () => { selectedCategory.value = category; },
                style: `
                  padding: 0.5rem 1rem;
                  border-radius: 6px;
                  border: 1px solid var(--border);
                  background: ${cat === category ? 'var(--primary)' : 'var(--bg)'};
                  color: ${cat === category ? 'white' : 'var(--text-primary)'};
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

      // Products Grid
      reactive(filteredProducts, (items) =>
        div({ style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;' },
          ...items.map(product =>
            button({
              onclick: () => addToCart(product),
              style: `
                padding: 1rem;
                background: var(--bg-card);
                border: 2px solid var(--border);
                border-radius: 12px;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
              `
            },
              div({ style: 'font-weight: 600; font-size: 1rem; color: var(--text-primary);' }, product.name),
              div({ style: 'font-size: 1.25rem; font-weight: bold; color: var(--primary);' }, `$${product.price.toFixed(2)}`),
              div({ style: 'font-size: 0.75rem; color: var(--text-muted);' }, product.category)
            )
          )
        )
      )
    ),

    // Right Side: Cart & Checkout
    div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 12px; padding: 1.5rem; height: fit-content; position: sticky; top: 1rem;' },
      div({ style: 'font-size: 1.5rem; font-weight: bold; margin-bottom: 1.5rem; color: var(--primary);' }, '🛒 Cart'),

      // Cart Items
      reactive(cart, (items) =>
        items.length === 0
          ? div({ style: 'text-align: center; padding: 2rem; color: var(--text-muted);' },
              div({ style: 'font-size: 3rem; margin-bottom: 0.5rem;' }, '🛒'),
              div('Cart is empty')
            )
          : div({ style: 'margin-bottom: 1.5rem; max-height: 300px; overflow-y: auto;' },
              ...items.map(item =>
                div({
                  style: `
                    padding: 0.75rem;
                    background: var(--bg);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                  `
                },
                  div({ style: 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;' },
                    div({ style: 'font-weight: 600; color: var(--text-primary);' }, item.product.name),
                    button({
                      onclick: () => removeFromCart(item.product.id),
                      style: 'background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 1.25rem;'
                    }, '×')
                  ),
                  div({ style: 'display: flex; justify-content: space-between; align-items: center;' },
                    div({ style: 'display: flex; gap: 0.5rem; align-items: center;' },
                      button({
                        onclick: () => updateQuantity(item.product.id, item.quantity - 1),
                        style: `
                          width: 28px;
                          height: 28px;
                          border-radius: 6px;
                          border: 1px solid var(--border);
                          background: var(--bg);
                          cursor: pointer;
                          font-weight: bold;
                        `
                      }, '−'),
                      span({ style: 'font-weight: 600; min-width: 30px; text-align: center;' }, String(item.quantity)),
                      button({
                        onclick: () => updateQuantity(item.product.id, item.quantity + 1),
                        style: `
                          width: 28px;
                          height: 28px;
                          border-radius: 6px;
                          border: 1px solid var(--border);
                          background: var(--bg);
                          cursor: pointer;
                          font-weight: bold;
                        `
                      }, '+')
                    ),
                    div({ style: 'font-weight: bold; color: var(--primary);' },
                      `$${(item.product.price * item.quantity).toFixed(2)}`
                    )
                  )
                )
              )
            )
      ),

      // Totals
      reactive(cart, () =>
        cart.value.length > 0
          ? div({ style: 'border-top: 2px solid var(--border); padding-top: 1rem; margin-bottom: 1rem;' },
              div({ style: 'display: flex; justify-content: space-between; margin-bottom: 0.5rem;' },
                span({ style: 'color: var(--text-muted);' }, 'Subtotal:'),
                span({ style: 'font-weight: 600;' }, `$${subtotal.value.toFixed(2)}`)
              ),
              div({ style: 'display: flex; justify-content: space-between; margin-bottom: 0.5rem;' },
                span({ style: 'color: var(--text-muted);' }, 'Tax (7%):'),
                span({ style: 'font-weight: 600;' }, `$${tax.value.toFixed(2)}`)
              ),
              div({ style: 'display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: bold; color: var(--primary);' },
                span('Total:'),
                span(`$${total.value.toFixed(2)}`)
              )
            )
          : null
      ),

      // Payment Section
      reactive(cart, () =>
        cart.value.length > 0
          ? div(
              div({ style: 'margin-bottom: 1rem;' },
                div({ style: 'font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--text-muted);' }, 'Payment Amount'),
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
                    font-size: 1.125rem;
                    font-weight: bold;
                  `,
                  oninput: (e: Event) => {
                    paymentAmount.value = (e.target as HTMLElement).textContent || '';
                  },
                  'data-placeholder': paymentAmount.value ? '' : '0.00'
                })
              ),
              div({ style: 'display: flex; gap: 0.5rem;' },
                button({
                  onclick: processPayment,
                  style: `
                    flex: 1;
                    padding: 0.875rem;
                    border-radius: 8px;
                    border: none;
                    background: var(--primary);
                    color: white;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                  `
                }, '💳 Pay'),
                button({
                  onclick: clearCart,
                  style: `
                    padding: 0.875rem 1.5rem;
                    border-radius: 8px;
                    border: 1px solid var(--border);
                    background: var(--bg);
                    color: var(--text-primary);
                    font-weight: 600;
                    cursor: pointer;
                  `
                }, '🗑️')
              )
            )
          : null
      )
    )
  );
};

// Source code examples
const posStateExample = `import { createState, computed, reactive, div, button } from 'elit';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// Available products
const products: Product[] = [
  { id: 1, name: 'Espresso', price: 3.50, category: 'Coffee', stock: 100 },
  { id: 2, name: 'Cappuccino', price: 4.50, category: 'Coffee', stock: 100 },
  // ... more products
];

// State
const cart = createState<CartItem[]>([]);
const selectedCategory = createState<string>('All');
const searchQuery = createState('');
const paymentAmount = createState('');`;

const posCartExample = `// Cart operations
const addToCart = (product: Product) => {
  const existingItem = cart.value.find(item => item.product.id === product.id);

  if (existingItem) {
    // Update quantity if product already in cart
    cart.value = cart.value.map(item =>
      item.product.id === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    );
  } else {
    // Add new item to cart
    cart.value = [...cart.value, { product, quantity: 1 }];
  }
};

const updateQuantity = (productId: number, quantity: number) => {
  if (quantity <= 0) {
    removeFromCart(productId);
  } else {
    cart.value = cart.value.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    );
  }
};

const removeFromCart = (productId: number) => {
  cart.value = cart.value.filter(item => item.product.id !== productId);
};

const clearCart = () => {
  cart.value = [];
};`;

const posComputedExample = `// Computed totals with automatic tracking
const subtotal = computed([cart], (items) => {
  return items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
});

const tax = computed([subtotal], (amount) => amount * 0.07); // 7% tax

const total = computed([subtotal, tax], (sub, taxAmount) => sub + taxAmount);

// Computed filtered products
const filteredProducts = computed([selectedCategory, searchQuery], (category, query) => {
  let filtered = products;

  if (category !== 'All') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (query.trim()) {
    const searchText = query.toLowerCase().trim();
    filtered = filtered.filter(p => p.name.toLowerCase().includes(searchText));
  }

  return filtered;
});`;

const posPaymentExample = `// Payment processing
const processPayment = () => {
  const payment = parseFloat(paymentAmount.value);

  if (!isNaN(payment) && payment >= total.value) {
    const change = payment - total.value;
    alert(\`Payment successful!\\nChange: $\${change.toFixed(2)}\`);
    clearCart();
    paymentAmount.value = '';
  } else {
    alert('Invalid payment amount');
  }
};

// Reactive cart display
reactive(cart, (items) =>
  items.length === 0
    ? div('Cart is empty')
    : div(
        ...items.map(item =>
          div(
            div(item.product.name),
            div(\`Qty: \${item.quantity}\`),
            div(\`$\${(item.product.price * item.quantity).toFixed(2)}\`)
          )
        )
      )
);`;

// POS System Content
export const POSSystemContent: VNode = div(
  // Demo
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 2rem 0; font-size: 1.75rem;' }, '💳 POS System'),
    POSSystemDemo()
  ),

  // Technical Overview
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🔧 Technical Implementation'),
    p({ style: 'color: var(--text-muted); margin-bottom: 2rem; line-height: 1.8;' },
      'This POS (Point of Sale) System demonstrates real-world e-commerce functionality with shopping cart management, ',
      'real-time price calculations, tax computation, and payment processing using Elit\'s reactive state system.'
    ),

    // Key Features
    div({ style: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;' },
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🛒 Shopping Cart'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Add, remove, and update quantities with real-time price calculations'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '💰 Auto Calculations'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Automatic subtotal, tax, and total calculations using computed state'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '🔍 Product Search'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Filter products by category and search with instant results'
        )
      ),
      div({ style: 'background: var(--bg); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border);' },
        h3({ style: 'margin: 0 0 0.75rem 0; font-size: 1.125rem; color: var(--primary);' }, '💳 Payment Processing'),
        p({ style: 'margin: 0; color: var(--text-muted); line-height: 1.6;' },
          'Simple payment flow with change calculation and cart clearing'
        )
      )
    )
  ),

  // Source Code
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem; margin-bottom: 3rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '💻 Source Code'),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '1. State & Data'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(posStateExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '2. Cart Operations'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(posCartExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '3. Computed Totals'),
    pre({ style: 'margin: 0 0 2rem 0;' }, code(...codeBlock(posComputedExample))),

    h3({ style: 'margin: 2rem 0 1rem 0; font-size: 1.25rem; color: var(--primary);' }, '4. Payment Processing'),
    pre({ style: 'margin: 0;' }, code(...codeBlock(posPaymentExample)))
  ),

  // Key Learnings
  div({ style: 'background: var(--bg-card); border: 2px solid var(--border); border-radius: 16px; padding: 2rem;' },
    h2({ style: 'margin: 0 0 1.5rem 0; font-size: 1.75rem;' }, '🎓 Key Learnings'),
    ul({ style: 'margin: 0; padding-left: 1.5rem; line-height: 2; color: var(--text-muted);' },
      li(strong('E-commerce cart:'), ' Implementing add, update, remove cart operations with immutable state updates'),
      li(strong('Computed chains:'), ' Using computed() for dependent calculations (subtotal → tax → total)'),
      li(strong('Array transformations:'), ' Using map, filter, find, and reduce for cart operations'),
      li(strong('Conditional logic:'), ' Checking if items exist before adding vs updating quantity'),
      li(strong('Price calculations:'), ' Real-time subtotal, tax, and total computations'),
      li(strong('Product filtering:'), ' Multi-criteria search with category and text filtering'),
      li(strong('Payment validation:'), ' Checking payment amount and calculating change'),
      li(strong('State reset:'), ' Clearing cart and form after successful payment'),
      li(strong('Reactive UI:'), ' Cart display updates automatically when items change'),
      li(strong('Two-column layout:'), ' Products grid on left, sticky cart on right')
    )
  )
);
