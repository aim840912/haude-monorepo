import { BadRequestException, PipeTransform } from '@nestjs/common';

export interface BoundedIntOptions {
  /** Used when the query param is missing or empty; omit to make it required. */
  default?: number;
  min?: number;
  max?: number;
}

/**
 * Parses an integer query param and enforces bounds.
 *
 * Replaces raw `parseInt` (NaN reaches Prisma → 500) and bare `ParseIntPipe`
 * (accepts any size, so `?limit=1000000` loads a whole table and a negative
 * `offset` makes Prisma throw → 500). Out-of-range values get a 400.
 */
export class ParseBoundedIntPipe implements PipeTransform<
  string | undefined,
  number
> {
  constructor(private readonly options: BoundedIntOptions) {}

  transform(value: string | undefined): number {
    const { default: fallback, min, max } = this.options;

    if (value === undefined || value === '') {
      if (fallback === undefined) {
        throw new BadRequestException('缺少必要的數字參數');
      }
      return fallback;
    }

    if (!/^-?\d+$/.test(value)) {
      throw new BadRequestException(`參數必須是整數：${value.slice(0, 20)}`);
    }

    const n = Number(value);
    if ((min !== undefined && n < min) || (max !== undefined && n > max)) {
      throw new BadRequestException(
        `參數超出範圍（${min ?? '-∞'} ~ ${max ?? '∞'}）`,
      );
    }
    return n;
  }
}

/** Page-size param: 1..max (default max 100). */
export const limitPipe = (defaultValue: number, max = 100) =>
  new ParseBoundedIntPipe({ default: defaultValue, min: 1, max });

/** Offset param: >= 0, default 0. */
export const offsetPipe = () => new ParseBoundedIntPipe({ default: 0, min: 0 });
