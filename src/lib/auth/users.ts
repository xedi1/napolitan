/**
 * Server-side user store
 * 
 * In production, use a proper database (Supabase, PostgreSQL, etc.)
 * Passwords are stored as bcrypt hashes
 * 
 * Default passwords:
 * - napol.hadi.m = manager
 * - napol.hadi.a = kitchen  
 * - napol.hadi.g = waiter
 * 
 * To generate new hashes, use:
 * import bcrypt from 'bcryptjs';
 * bcrypt.hashSync('password', 10)
 */

import { UserRole } from '@/types';
import bcrypt from 'bcryptjs';

export interface ServerUser {
  id: number;
  username: string;
  passwordHash: string;
  name: string;
  role: UserRole;
}

// Pre-computed bcrypt hashes for demo passwords (cost factor 10)
const DEMO_PASSWORD_HASHES = {
  manager: '$2b$10$9F0enb.apSFT9e.jH4CkzOWWsHs7N9rKVn34qqSJRGMLJGSj7A.lq',
  kitchen: '$2b$10$WnwOwYVlJMbDeOn9g.jO4.NDsPHTxjgXIORK/ozUEgG2M88ls0wYe', 
  waiter: '$2b$10$56u/ETqq6p.HnhdDL.gBH.r9JwLV9vIqFhsnZDaRLRM48f5nTVUcu',
};

// NOTE: Default hash is for password 'napol.hadi.X' - replace with actual hashes in production
// Use environment variables to override hashes in production
const DEMO_USERS: ServerUser[] = [
  {
    id: 1,
    username: '09141632302',
    passwordHash: process.env.MANAGER_PASSWORD_HASH || DEMO_PASSWORD_HASHES.manager,
    name: 'مدیریت',
    role: 'manager',
  },
  {
    id: 2,
    username: '09141632302',
    passwordHash: process.env.KITCHEN_PASSWORD_HASH || DEMO_PASSWORD_HASHES.kitchen,
    name: 'آشپزخانه',
    role: 'kitchen',
  },
  {
    id: 3,
    username: '09141632302',
    passwordHash: process.env.WAITER_PASSWORD_HASH || DEMO_PASSWORD_HASHES.waiter,
    name: 'گارسون',
    role: 'waiter',
  },
];

export function findUserByUsername(username: string): ServerUser | undefined {
  return DEMO_USERS.find(u => u.username === username);
}

export async function validatePassword(user: ServerUser, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.passwordHash);
}

export function getUserPublic(user: ServerUser): Omit<ServerUser, 'passwordHash'> {
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

// Utility function to generate hash for a password (use this to generate production hashes)
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}
