/**
 * POST /api/auth/login
 * Secure authentication endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';

const MOCK_USERS = {
  manager: { password: 'manager123', name: 'مدیریت', role: 'manager' as const },
  kitchen: { password: 'kitchen123', name: 'آشپزخانه', role: 'kitchen' as const },
  waiter: { password: 'waiter123', name: 'گارسون', role: 'waiter' as const },
};

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const sanitizedUsername = username.trim().toLowerCase();
    
    const user = MOCK_USERS[sanitizedUsername as keyof typeof MOCK_USERS];
    if (!user || user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const userId = sanitizedUsername === 'manager' ? 1 : sanitizedUsername === 'kitchen' ? 2 : 3;
    
    const accessToken = await generateAccessToken({
      userId,
      username: sanitizedUsername,
      name: user.name,
      role: user.role,
    });

    const refreshToken = await generateRefreshToken({
      userId,
      username: sanitizedUsername,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: userId,
        username: sanitizedUsername,
        name: user.name,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
