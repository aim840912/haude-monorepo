import { BadRequestException } from '@nestjs/common';
import { ParseBoundedIntPipe } from './parse-bounded-int.pipe';

describe('ParseBoundedIntPipe', () => {
  const pipe = new ParseBoundedIntPipe({ default: 20, min: 1, max: 100 });

  it('returns the default when the query param is missing', () => {
    expect(pipe.transform(undefined)).toBe(20);
  });

  it('returns the default when the query param is empty', () => {
    expect(pipe.transform('')).toBe(20);
  });

  it('parses an in-range integer', () => {
    expect(pipe.transform('50')).toBe(50);
  });

  it('rejects a non-numeric value instead of passing NaN on', () => {
    expect(() => pipe.transform('abc')).toThrow(BadRequestException);
  });

  it('rejects a decimal', () => {
    expect(() => pipe.transform('1.5')).toThrow(BadRequestException);
  });

  it('rejects a value above max', () => {
    expect(() => pipe.transform('101')).toThrow(BadRequestException);
  });

  it('rejects a value below min', () => {
    expect(() => pipe.transform('0')).toThrow(BadRequestException);
  });

  it('accepts the boundaries', () => {
    expect(pipe.transform('1')).toBe(1);
    expect(pipe.transform('100')).toBe(100);
  });

  it('rejects a negative offset', () => {
    const offset = new ParseBoundedIntPipe({ default: 0, min: 0 });
    expect(() => offset.transform('-5')).toThrow(BadRequestException);
    expect(offset.transform('5000')).toBe(5000);
  });

  // main.ts's global ValidationPipe({ transform: true }) runs first and turns
  // a `limit: number` query param into a number, so 'abc' arrives as NaN.
  describe('after the global ValidationPipe converted the value', () => {
    it('rejects NaN with 400, not a TypeError', () => {
      expect(() => pipe.transform(NaN)).toThrow(BadRequestException);
    });

    it('rejects a converted decimal', () => {
      expect(() => pipe.transform(1.5)).toThrow(BadRequestException);
    });

    it('accepts a converted in-range integer', () => {
      expect(pipe.transform(50)).toBe(50);
    });

    it('rejects a converted out-of-range value', () => {
      expect(() => pipe.transform(101)).toThrow(BadRequestException);
    });
  });

  it('requires a value when no default is given', () => {
    const year = new ParseBoundedIntPipe({ min: 2000, max: 2100 });
    expect(() => year.transform(undefined)).toThrow(BadRequestException);
    expect(year.transform('2026')).toBe(2026);
  });
});
