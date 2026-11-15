-- Store bearer tokens as SHA-256 hex (see src/modules/auth/token-hash.ts).
-- Converts existing raw tokens in place so live sessions and pending reset
-- links keep working after the deploy. Must run exactly once (Prisma's
-- migration history guarantees that); running it again would hash twice.
-- PostgreSQL >= 11 provides sha256(bytea); encode(..., 'hex') is lowercase,
-- matching Node's createHash('sha256').digest('hex').
UPDATE "refresh_tokens"
SET "token" = encode(sha256(convert_to("token", 'UTF8')), 'hex');

UPDATE "password_reset_tokens"
SET "token" = encode(sha256(convert_to("token", 'UTF8')), 'hex');
