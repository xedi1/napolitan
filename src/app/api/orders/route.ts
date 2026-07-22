/**
 * GET /api/orders - Get all orders
 * POST /api/orders - Create new order
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory orders storage (for demo purposes - use database in production)
const orders: Map<string, unknown> = new Map();

export async function GET(request: NextRequest) {
  try {
    const allOrders = Array.from(orders.values());
    return NextResponse.json({
      success: true,
      data: allOrders,
    });
  } catch (error) {
    console.error('[Orders] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Calculate totals
    const subtotal = body.items.reduce((sum: number, item: { price: number; quantity: number }) => 
      sum + (item.price * item.quantity), 0);
    
    const discount = body.discountPercent 
      ? Math.round(subtotal * (body.discountPercent / 100)) 
      : 0;
    const total = subtotal - discount;

    const order = {
      id: orderId,
      tableId: body.tableId || null,
      items: body.items,
      status: 'pending',
      subtotal,
      discount,
      discountPercent: body.discountPercent,
      total,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: body.createdBy || 0,
    };

    orders.set(orderId, order);

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('[Orders] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
