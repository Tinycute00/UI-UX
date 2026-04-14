import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password with bcrypt.
 * @param plain - The plain-text password to hash.
 * @returns A bcrypt hash string (starts with $2b$).
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare a plain-text password against a bcrypt hash.
 * @param plain - The plain-text password to verify.
 * @param hash  - The stored bcrypt hash.
 * @returns true if the passwords match, false otherwise.
 */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
