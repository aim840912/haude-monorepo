import { SetMetadata } from '@nestjs/common';

/**
 * 快取時間控制裝飾器
 *
 * 用於為公開 API 端點明確啟用 Cache-Control 標頭。
 * 僅對 GET 請求生效。
 *
 * 預設行為：所有 GET 請求不快取（no-store），需透過此裝飾器明確啟用。
 * 只有匿名、公開、所有使用者看到相同資料的端點才應該啟用快取。
 *
 * @param maxAge 快取最大存活時間（秒）。設為 0 表示不快取。
 *
 * @example
 * // 公開產品列表 - 5 分鐘快取（class 層級）
 * @Cacheable(300)
 * @Controller('products')
 * export class ProductsController {}
 *
 * @example
 * // 搜尋結果 - 1 分鐘短快取（class 層級）
 * @Cacheable(60)
 * @Controller('search')
 * export class SearchController {}
 *
 * @example
 * // 混合 controller 中的單一公開 method
 * @Cacheable(300)
 * @Get('products/:productId/reviews')
 * getProductReviews() {}
 */
export const CACHE_MAX_AGE_KEY = 'cache-max-age';

export const Cacheable = (maxAge: number) =>
  SetMetadata(CACHE_MAX_AGE_KEY, maxAge);

/**
 * 標記端點為不可快取
 *
 * 等同於 @Cacheable(0)，但語意更清晰。
 * 用於在有 class 層級 @Cacheable() 的 controller 中，
 * 覆蓋特定 method 使其不被快取（如混合 controller 中的認證端點）。
 *
 * 注意：由於預設已是不快取，純 user-auth 或 admin controller 不需要此裝飾器。
 *
 * @example
 * // 在有 @Cacheable(300) 的 class 中覆蓋特定 method
 * @Cacheable(300)
 * @Controller('farm-tours')
 * export class FarmToursController {
 *   @NoCache()
 *   @Get('bookings/my')
 *   getMyBookings() {} // 此端點不會被快取
 * }
 */
export const NoCache = () => SetMetadata(CACHE_MAX_AGE_KEY, 0);
