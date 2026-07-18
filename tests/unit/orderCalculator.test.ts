import { describe, it, expect } from 'vitest';
import {
  calculateSubtotal,
  applyDiscount,
  calculateTax,
  calculateTotal,
  addItemToOrder,
  removeItemFromOrder,
  updateItemQuantity,
  type OrderItem,
  type Order,
} from '@/lib/orderCalculator';

describe('Order Calculator', () => {
  // Sample items for testing
  const sampleItems: OrderItem[] = [
    { id: 'item-1', menuItemId: 'espresso', name: 'اسپرسو', quantity: 2, price: 70000 },
    { id: 'item-2', menuItemId: 'latte', name: 'لاته', quantity: 1, price: 95000 },
    { id: 'item-3', menuItemId: 'cake', name: 'کیک', quantity: 1, price: 140000 },
  ];

  // Base order for testing
  const baseOrder: Order = {
    id: 'order-1',
    tableId: 1,
    items: sampleItems,
    status: 'pending',
    subtotal: 375000, // 2*70000 + 95000 + 140000
    total: 375000,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: 1,
  };

  describe('calculateSubtotal', () => {
    it('should calculate subtotal correctly', () => {
      const result = calculateSubtotal(sampleItems);
      expect(result).toBe(375000); // 2*70000 + 95000 + 140000
    });

    it('should return 0 for empty items array', () => {
      const result = calculateSubtotal([]);
      expect(result).toBe(0);
    });

    it('should handle single item', () => {
      const result = calculateSubtotal([sampleItems[0]]);
      expect(result).toBe(140000); // 2 * 70000
    });

    it('should handle items with quantity 1', () => {
      const items: OrderItem[] = [
        { id: 'item-1', menuItemId: 'espresso', name: 'اسپرسو', quantity: 1, price: 70000 },
      ];
      const result = calculateSubtotal(items);
      expect(result).toBe(70000);
    });
  });

  describe('applyDiscount', () => {
    it('should apply percentage discount correctly', () => {
      const subtotal = 100000;
      const result = applyDiscount(subtotal, 10, true);
      expect(result).toBe(10000); // 10% of 100000
    });

    it('should apply fixed discount correctly', () => {
      const subtotal = 100000;
      const result = applyDiscount(subtotal, 15000, false);
      expect(result).toBe(15000);
    });

    it('should not exceed subtotal for fixed discount', () => {
      const subtotal = 50000;
      const result = applyDiscount(subtotal, 100000, false);
      expect(result).toBe(50000); // Capped at subtotal
    });

    it('should handle 100% discount', () => {
      const subtotal = 100000;
      const result = applyDiscount(subtotal, 100, true);
      expect(result).toBe(100000);
    });

    it('should handle 0% discount', () => {
      const subtotal = 100000;
      const result = applyDiscount(subtotal, 0, true);
      expect(result).toBe(0);
    });
  });

  describe('calculateTax', () => {
    it('should calculate 9% tax correctly', () => {
      const result = calculateTax(100000, 9);
      expect(result).toBe(9000);
    });

    it('should round tax to nearest integer', () => {
      const result = calculateTax(33333, 9);
      expect(result).toBe(3000); // 9% of 33333 = 2999.97, rounded to 3000
    });

    it('should return 0 for 0% tax', () => {
      const result = calculateTax(100000, 0);
      expect(result).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total without discount or tax', () => {
      const result = calculateTotal(sampleItems);
      expect(result.subtotal).toBe(375000);
      expect(result.total).toBe(375000);
      expect(result.discount).toBe(0);
      expect(result.tax).toBe(0);
    });

    it('should apply percentage discount', () => {
      const result = calculateTotal(sampleItems, { discountPercent: 10 });
      expect(result.subtotal).toBe(375000);
      expect(result.discount).toBe(37500); // 10%
      expect(result.total).toBe(337500); // 375000 - 37500
    });

    it('should apply fixed discount', () => {
      const result = calculateTotal(sampleItems, { discountAmount: 20000 });
      expect(result.subtotal).toBe(375000);
      expect(result.discount).toBe(20000);
      expect(result.total).toBe(355000); // 375000 - 20000
    });

    it('should apply tax after discount', () => {
      const result = calculateTotal(sampleItems, { taxPercent: 9 });
      expect(result.subtotal).toBe(375000);
      expect(result.tax).toBe(33750); // 9% of 375000
      expect(result.total).toBe(408750); // 375000 + 33750
    });

    it('should apply both discount and tax', () => {
      const result = calculateTotal(sampleItems, {
        discountPercent: 10,
        taxPercent: 9,
      });
      expect(result.subtotal).toBe(375000);
      expect(result.discount).toBe(37500); // 10%
      expect(result.tax).toBe(30375); // 9% of (375000 - 37500) = 9% of 337500
      expect(result.total).toBe(367875); // 337500 + 30375
    });

    it('should include items in result', () => {
      const result = calculateTotal(sampleItems);
      expect(result.items).toEqual(sampleItems);
    });

    it('should set status to pending', () => {
      const result = calculateTotal(sampleItems);
      expect(result.status).toBe('pending');
    });
  });

  describe('addItemToOrder', () => {
    it('should add item to order', () => {
      const newItem = { menuItemId: 'mocha', name: 'موکا', quantity: 1, price: 110000 };
      const result = addItemToOrder(baseOrder, newItem);
      
      expect(result.items.length).toBe(4);
      expect(result.subtotal).toBe(485000); // 375000 + 110000
      expect(result.total).toBe(485000);
    });

    it('should generate unique id for new item', () => {
      const newItem = { menuItemId: 'mocha', name: 'موکا', quantity: 1, price: 110000 };
      const result = addItemToOrder(baseOrder, newItem);
      
      const addedItem = result.items.find(i => i.menuItemId === 'mocha');
      expect(addedItem?.id).toBeDefined();
      expect(addedItem?.id).toMatch(/^item-/);
    });

    it('should preserve existing items', () => {
      const newItem = { menuItemId: 'mocha', name: 'موکا', quantity: 1, price: 110000 };
      const result = addItemToOrder(baseOrder, newItem);
      
      expect(result.items.slice(0, 3)).toEqual(sampleItems);
    });
  });

  describe('removeItemFromOrder', () => {
    it('should remove item from order', () => {
      const result = removeItemFromOrder(baseOrder, 'item-1');
      
      expect(result.items.length).toBe(2);
      expect(result.items.find(i => i.id === 'item-1')).toBeUndefined();
    });

    it('should recalculate subtotal after removal', () => {
      const result = removeItemFromOrder(baseOrder, 'item-1');
      // 95000 + 140000 = 235000
      expect(result.subtotal).toBe(235000);
      expect(result.total).toBe(235000);
    });

    it('should handle removing non-existent item', () => {
      const result = removeItemFromOrder(baseOrder, 'non-existent');
      expect(result.items.length).toBe(3);
      expect(result.subtotal).toBe(375000);
    });
  });

  describe('updateItemQuantity', () => {
    it('should update item quantity', () => {
      const result = updateItemQuantity(baseOrder, 'item-1', 5);
      
      const updatedItem = result.items.find(i => i.id === 'item-1');
      expect(updatedItem?.quantity).toBe(5);
    });

    it('should recalculate subtotal after quantity update', () => {
      const result = updateItemQuantity(baseOrder, 'item-1', 5);
      // 5*70000 + 95000 + 140000 = 585000
      expect(result.subtotal).toBe(585000);
    });

    it('should remove item if quantity is 0', () => {
      const result = updateItemQuantity(baseOrder, 'item-1', 0);
      expect(result.items.find(i => i.id === 'item-1')).toBeUndefined();
    });

    it('should remove item if quantity is negative', () => {
      const result = updateItemQuantity(baseOrder, 'item-1', -1);
      expect(result.items.find(i => i.id === 'item-1')).toBeUndefined();
    });

    it('should not change anything for non-existent item', () => {
      const result = updateItemQuantity(baseOrder, 'non-existent', 5);
      expect(result.subtotal).toBe(375000);
    });
  });
});
