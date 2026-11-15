import { envValidationSchema } from './env.validation';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
};

function errorFor(env: Record<string, string>) {
  return envValidationSchema.validate(
    { ...base, ...env },
    { allowUnknown: true },
  ).error;
}

describe('envValidationSchema JWT_SECRET', () => {
  const strong = 'q8Zr1vXk3m9Lp2Wd7Ns4Bt6Yh0Fc5Ja-strong';

  // docker-compose's fallback (31 chars) is already rejected by min(32).
  it('rejects the .env.example placeholder in production', () => {
    expect(
      errorFor({
        NODE_ENV: 'production',
        JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
      }),
    ).toBeDefined();
  });

  it('allows the .env.example placeholder outside production', () => {
    expect(
      errorFor({
        NODE_ENV: 'development',
        JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
      }),
    ).toBeUndefined();
  });

  it('accepts a real secret in production', () => {
    expect(
      errorFor({ NODE_ENV: 'production', JWT_SECRET: strong }),
    ).toBeUndefined();
  });

  it('still rejects short secrets', () => {
    expect(errorFor({ JWT_SECRET: 'short' })).toBeDefined();
  });

  it('keeps min(32) on the production branch of when()', () => {
    expect(
      errorFor({ NODE_ENV: 'production', JWT_SECRET: 'short' }),
    ).toBeDefined();
  });
});
