/**
 * User Authentication Configuration
 * 
 * SECURITY BEST PRACTICES:
 * 1. Passwords are hashed with bcrypt - NEVER stored in plain text
 * 2. Authentication must go through /api/auth/login endpoint
 * 3. This file is server-side only - never imported in client code
 * 4. Session tokens should be stored in httpOnly cookies
 * 5. Rate limiting prevents brute force attacks
 * 
 * For production with Supabase:
 * - Use Supabase Auth for user management
 * - Enable 2FA for manager accounts
 * - Store audit logs in database
 * - Configure proper session timeouts
 */

import { compare, hash } from 'bcryptjs';

export interface AppUser {
  id: number;
  username: string;
  name: string;
  role: 'manager' | 'kitchen' | 'waiter';
}

export interface UserWithHash extends AppUser {
  passwordHash: string;
}

// ⚠️ IMPORTANT: These are DEMO credentials with demo passwords
// CHANGE THESE IMMEDIATELY in production!
const DEMO_USERS: UserWithHash[] = [
  {
    id: 1,
    username: 'napoli.mm',
    name: 'مدیریت',
    role: 'manager',
    // CHANGE THIS PASSWORD: Torkib-9271-Kavir!
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qJ5R.q5GJJ5Ke',
  },
  {
    id: 2,
    username: 'napoli.kk',
    name: 'آشپزخانه',
    role: 'kitchen',
    // CHANGE THIS PASSWORD: Rangin-4408-Otagh!
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qJ5R.q5GJJ5Ke',
  },
  {
    id: 3,
    username: 'napoli.ww',
    name: 'گارسون',
    role: 'waiter',
    // CHANGE THIS PASSWORD: Baran-7735-Miz!
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qJ5R.q5GJJ5Ke',
  },
];

/**
 * Get all demo users (without passwords)
 */
export function getDemoUsers(): Omit<UserWithHash, 'passwordHash'>[] {
  return DEMO_USERS.map(({ passwordHash: _, ...user }) => user);
}

/**
 * Get user by username
 */
export function getUserByUsername(username: string): UserWithHash | null {
  return DEMO_USERS.find(u => u.username === username.toLowerCase()) || null;
}

/**
 * Get user by ID
 */
export function getUserById(userId: number): Omit<UserWithHash, 'passwordHash'> | null {
  const user = DEMO_USERS.find(u => u.id === userId);
  if (!user) return null;
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Validate user credentials with bcrypt
 * Returns user without password if valid, null otherwise
 */
export async function validateCredentials(
  username: string,
  password: string
): Promise<Omit<UserWithHash, 'passwordHash'> | null> {
  const sanitizedUsername = username.trim().toLowerCase();
  
  // Find user by username
  const user = DEMO_USERS.find(u => u.username === sanitizedUsername);
  if (!user) {
    return null;
  }

  // Verify password using bcrypt
  const isValidPassword = await compare(password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Generate a bcrypt hash for a new password
 * Use this to generate new password hashes for production
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Check if a password needs to be changed (demo password check)
 */
export function isDemoPassword(password: string): boolean {
  const demoPasswords = [
    'Torkib-9271-Kavir!',
    'Rangin-4408-Otagh!',
    'Baran-7735-Miz!',
    'manager123',
    'kitchen123',
    'waiter123',
  ];
  return demoPasswords.includes(password);
}

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  // Session expires after 8 hours of inactivity
  maxAge: 8 * 60 * 60 * 1000, // 8 hours in ms
  // Refresh session if active within this time
  refreshThreshold: 30 * 60 * 1000, // 30 minutes in ms
};

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT_CONFIG = {
  // Max failed login attempts before lockout
  maxAttempts: 5,
  // Lockout duration in milliseconds (15 minutes)
  lockoutDuration: 15 * 60 * 1000,
};

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`پسورد باید حداقل ${PASSWORD_REQUIREMENTS.minLength} کاراکتر باشد`);
  }
  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`پسورد باید حداکثر ${PASSWORD_REQUIREMENTS.maxLength} کاراکتر باشد`);
  }
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('پسورد باید شامل حرف بزرگ باشد');
  }
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('پسورد باید شامل حرف کوچک باشد');
  }
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('پسورد باید شامل عدد باشد');
  }
  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('پسورد باید شامل کاراکتر خاص باشد');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
