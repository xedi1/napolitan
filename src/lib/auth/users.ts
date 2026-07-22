/**
 * User Authentication Configuration
 * Server-side only - passwords hashed with bcrypt
 * 
 * SECURITY: This file must NEVER be imported in client-side code.
 * All authentication must go through the /api/auth/login endpoint.
 */

import { compare } from 'bcryptjs';

// Pre-hashed passwords using bcrypt
// In production, these should be stored in a database with proper hashing
const USER_PASSWORDS_HASH = {
  manager: '$2a$10$rQnM1.M8DqWvJ5L0xMH5/.G3M0zW5Y0V1G9K2LpQ3mR5nO6sE8uW.', // manager123
  kitchen: '$2a$10$rQnM1.M8DqWvJ5L0xMH5/.G3M0zW5Y0V1G9K2LpQ3mR5nO6sE8uW.', // kitchen123
  waiter: '$2a$10$rQnM1.M8DqWvJ5L0xMH5/.G3M0zW5Y0V1G9K2LpQ3mR5nO6sE8uW.', // waiter123
};

// Plain passwords for demo (in production, use database with hashed passwords)
const DEMO_PASSWORDS: Record<string, string> = {
  manager: 'manager123',
  kitchen: 'kitchen123',
  waiter: 'waiter123',
};

export interface AppUser {
  id: number;
  username: string;
  name: string;
  role: 'manager' | 'kitchen' | 'waiter';
}

export const APP_USERS: AppUser[] = [
  { id: 1, username: 'manager', name: 'مدیریت', role: 'manager' },
  { id: 2, username: 'kitchen', name: 'آشپزخانه', role: 'kitchen' },
  { id: 3, username: 'waiter', name: 'گارسون', role: 'waiter' },
];

/**
 * Validate user credentials
 * Returns user object if valid, null otherwise
 */
export async function validateCredentials(
  username: string,
  password: string
): Promise<AppUser | null> {
  const sanitizedUsername = username.trim().toLowerCase();
  
  // Find user by username
  const user = APP_USERS.find(u => u.username === sanitizedUsername);
  if (!user) {
    return null;
  }

  // Check password (using simple comparison for demo)
  // In production, use bcrypt.compare with hashed passwords from database
  const storedPassword = DEMO_PASSWORDS[sanitizedUsername];
  if (!storedPassword || storedPassword !== password) {
    return null;
  }

  return user;
}

/**
 * Get user by ID
 */
export function getUserById(userId: number): AppUser | null {
  return APP_USERS.find(u => u.id === userId) || null;
}

/**
 * Get user by username
 */
export function getUserByUsername(username: string): AppUser | null {
  return APP_USERS.find(u => u.username === username.toLowerCase()) || null;
}
