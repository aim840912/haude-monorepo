import { stripUrlSecrets, stripUrlSecretsInText } from './url-secrets';

describe('stripUrlSecretsInText', () => {
  it('strips the query of a path inside a message', () => {
    expect(stripUrlSecretsInText('Cannot GET /api/v2/x?token=abc')).toBe(
      'Cannot GET /api/v2/x',
    );
  });

  it('strips the fragment of an absolute URL inside a message', () => {
    expect(stripUrlSecretsInText('to https://a.example/cb#user=1 done')).toBe(
      'to https://a.example/cb done',
    );
  });

  it('leaves a question mark in prose alone', () => {
    expect(stripUrlSecretsInText('Retry? yes')).toBe('Retry? yes');
  });
});

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

  it('cleans every value of an array header', () => {
    expect(stripUrlSecrets(['/a?x=1', '/b#y'])).toEqual(['/a', '/b']);
  });

  it('passes a missing value through', () => {
    expect(stripUrlSecrets(undefined)).toBeUndefined();
  });
});
