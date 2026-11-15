import { createHash } from 'crypto';

/**
 * Hash a bearer token (refresh / password-reset) before it touches the DB.
 *
 * The raw token only lives in the cookie or the email link; the database keeps
 * SHA-256 of it, so a leaked table or backup cannot be replayed. A plain fast
 * hash is enough here: the tokens are 32–40 random bytes, not guessable
 * passwords, so there is nothing for a slow KDF to protect against.
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
