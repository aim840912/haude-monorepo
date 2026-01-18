/**
 * UUID Mock for E2E Tests
 */
export const v4 = jest.fn(
  () => 'mock-uuid-' + Math.random().toString(36).substring(7),
);

export const validate = jest.fn(() => true);

export const version = jest.fn(() => 4);

export const NIL = '00000000-0000-0000-0000-000000000000';

export const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

export default {
  v4,
  validate,
  version,
  NIL,
  MAX,
};
