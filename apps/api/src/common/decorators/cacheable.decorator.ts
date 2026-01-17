import { SetMetadata } from '@nestjs/common';

/**
 * 快取時間控制裝飾器
 *
 * 用於控制個別 API 端點的 Cache-Control 標頭。
 * 僅對 GET 請求生效。
 *
 * @param maxAge 快取最大存活時間（秒）。設為 0 表示不快取。
 *
 * @example
 * // 產品列表 - 5 分鐘快取
 * @Cacheable(300)
 * @Get()
 * findAll() {}
 *
 * @example
 * // 即時資料 - 不快取
 * @Cacheable(0)
 * @Get('live')
 * getLiveData() {}
 */
export const CACHE_MAX_AGE_KEY = 'cache-max-age';

export const Cacheable = (maxAge: number) =>
  SetMetadata(CACHE_MAX_AGE_KEY, maxAge);

/**
 * 標記端點為不可快取
 *
 * 等同於 @Cacheable(0)，但語意更清晰。
 * 適用於包含使用者特定資料的端點。
 *
 * @example
 * @NoCache()
 * @Get('me')
 * getProfile() {}
 */
export const NoCache = () => SetMetadata(CACHE_MAX_AGE_KEY, 0);
