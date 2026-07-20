// Order calculation utilities

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  tableId: number;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'paid' | 'cancelled';
  subtotal: number;
  discount?: number;
  discountPercent?: number;
  tax?: number;
  taxPercent?: number;
  total: number;
  createdAt: number;
  updatedAt: number;
  createdBy: number;
  barType?: 'cold' | 'hot'; // Kitchen section filter
}

// Calculate subtotal from items
export function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Apply discount (percentage or fixed amount)
export function applyDiscount(subtotal: number, discount: number, isPercentage = false): number {
  if (isPercentage) {
    return Math.round(subtotal * (discount / 100));
  }
  return Math.min(discount, subtotal); // Can't discount more than subtotal
}

// Calculate tax
export function calculateTax(amount: number, taxPercent: number): number {
  return Math.round(amount * (taxPercent / 100));
}

// Calculate total
export function calculateTotal(
  items: OrderItem[],
  options: {
    discountPercent?: number;
    discountAmount?: number;
    taxPercent?: number;
  } = {}
): Order {
  const subtotal = calculateSubtotal(items);
  const discountAmount = options.discountPercent
    ? applyDiscount(subtotal, options.discountPercent, true)
    : options.discountAmount || 0;
  
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = options.taxPercent
    ? calculateTax(afterDiscount, options.taxPercent)
    : 0;
  
  const total = afterDiscount + taxAmount;

  return {
    id: `order-${Date.now()}`,
    tableId: 0,
    items,
    status: 'pending',
    subtotal,
    discount: discountAmount,
    discountPercent: options.discountPercent,
    tax: taxAmount,
    taxPercent: options.taxPercent,
    total,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 0,
  };
}

// Add item to order
export function addItemToOrder(
  order: Order,
  item: Omit<OrderItem, 'id'>
): Order {
  const newItem: OrderItem = {
    ...item,
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };

  const updatedItems = [...order.items, newItem];
  const newSubtotal = calculateSubtotal(updatedItems);

  return {
    ...order,
    items: updatedItems,
    subtotal: newSubtotal,
    total: newSubtotal - (order.discount || 0) + (order.tax || 0),
    updatedAt: Date.now(),
  };
}

// Remove item from order
export function removeItemFromOrder(order: Order, itemId: string): Order {
  const updatedItems = order.items.filter(item => item.id !== itemId);
  const newSubtotal = calculateSubtotal(updatedItems);

  return {
    ...order,
    items: updatedItems,
    subtotal: newSubtotal,
    total: newSubtotal - (order.discount || 0) + (order.tax || 0),
    updatedAt: Date.now(),
  };
}

// Update item quantity
export function updateItemQuantity(order: Order, itemId: string, quantity: number): Order {
  if (quantity <= 0) {
    return removeItemFromOrder(order, itemId);
  }

  const updatedItems = order.items.map(item =>
    item.id === itemId ? { ...item, quantity } : item
  );
  const newSubtotal = calculateSubtotal(updatedItems);

  return {
    ...order,
    items: updatedItems,
    subtotal: newSubtotal,
    total: newSubtotal - (order.discount || 0) + (order.tax || 0),
    updatedAt: Date.now(),
  };
}

// Format price for display
export function formatOrderPrice(amount: number, currency = 'تومان'): string {
  const formatted = new Intl.NumberFormat('fa-IR').format(amount);
  return `${formatted} ${currency}`;
}
