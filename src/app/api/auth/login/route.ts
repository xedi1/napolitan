/**
 * POST /api/auth/login
 * Secure authentication endpoint - validates credentials server-side
 * 
 * SECURITY: Password validation happens HERE, not in client code.
 * This file is server-side only and never exposed to clients.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { validateCredentials } from '@/lib/auth/users';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    // Validate credentials server-side
    const user = await validateCredentials(username, password);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'نام کاربری یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    // Generate JWT tokens
    const accessToken = await generateAccessToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    const refreshToken = await generateRefreshToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    return NextResponse.json(
      { success: false, error: 'خطای سرور در ورود' },
      { status: 500 }
    );
  }
}
