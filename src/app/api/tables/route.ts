/**
 * GET /api/tables
 * Get all tables
 */

import { NextRequest, NextResponse } from 'next/server';

// Default tables data (same as store for consistency)
const DEFAULT_TABLES = [
  { id: 1, shape: 'circle' as const, group: 'main', position: { x: 0, y: 0 }, seats: 4, status: 'available' as const, floor: 1, lastUpdated: Date.now() },
  { id: 2, shape: 'circle' as const, group: 'main', position: { x: 1, y: 0 }, seats: 4, status: 'available' as const, floor: 1, lastUpdated: Date.now() },
  { id: 3, shape: 'rectangle' as const, group: 'main', position: { x: 2, y: 0 }, seats: 6, status: 'available' as const, floor: 1, lastUpdated: Date.now() },
  { id: 4, shape: 'circle' as const, group: 'window', position: { x: 0, y: 1 }, seats: 2, status: 'available' as const, floor: 1, lastUpdated: Date.now() },
  { id: 5, shape: 'circle' as const, group: 'window', position: { x: 1, y: 1 }, seats: 2, status: 'available' as const, floor: 1, lastUpdated: Date.now() },
  { id: 6, shape: 'rectangle' as const, group: 'vip', position: { x: 0, y: 0 }, seats: 8, status: 'available' as const, floor: 2, lastUpdated: Date.now() },
  { id: 7, shape: 'circle' as const, group: 'vip', position: { x: 1, y: 0 }, seats: 4, status: 'available' as const, floor: 2, lastUpdated: Date.now() },
  { id: 8, shape: 'circle' as const, group: 'vip', position: { x: 2, y: 0 }, seats: 4, status: 'available' as const, floor: 2, lastUpdated: Date.now() },
];

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      data: DEFAULT_TABLES,
    });
  } catch (error) {
    console.error('[Tables] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tables' },
      { status: 500 }
    );
  }
}
