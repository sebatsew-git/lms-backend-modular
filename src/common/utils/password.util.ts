/**
 * Hashes passwords and verifies submitted credentials using Argon2. Centralizes secure password handling for account operations.
 */

import argon2 from 'argon2';

export const hashPassword = (plain: string) =>
  argon2.hash(plain, { type: argon2.argon2id, memoryCost: 2 ** 16, timeCost: 3, parallelism: 1 });

export const verifyPassword = (hash: string, plain: string) => argon2.verify(hash, plain);
