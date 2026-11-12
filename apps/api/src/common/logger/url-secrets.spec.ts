import { stripUrlSecrets } from './url-secrets';

describe('stripUrlSecrets', () => {
  it('drops the query string', () => {
    expect(stripUrlSecrets('/api/v1/auth/verify-reset-token?token=abc')).toBe(
      '/api/v1/auth/verify-reset-token',
    );
  });

  it('drops the fragment', () => {
    expect(
      stripUrlSecrets(
        'https://haude-admin.vercel.app/auth/callback#user=%7B%7D',
      ),
    ).toBe('https://haude-admin.vercel.app/auth/callback');
  });

  it('leaves a plain path alone', () => {
    expect(stripUrlSecrets('/api/v1/products')).toBe('/api/v1/products');
  });

  it('passes a missing value through', () => {
    expect(stripUrlSecrets(undefined)).toBeUndefined();
  });
});
