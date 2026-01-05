/**
 * 訂單計算工具
 * 負責運費、稅金等計算邏輯
 *
 * 商業規則：
 * - 基本運費：60 元
 * - 滿 1000 元免運
 * - 偏遠地區（離島、山區）加收 40 元
 * - 台灣食品類商品免營業稅
 */
export class OrderCalculator {
  // 商業規則配置
  private static readonly BASE_SHIPPING_FEE = 60; // 基本運費 60 元
  private static readonly FREE_SHIPPING_THRESHOLD = 1000; // 滿 1000 元免運費
  private static readonly REMOTE_AREA_SURCHARGE = 40; // 偏遠地區加收 40 元
  private static readonly REMOTE_AREAS = ['離島', '山區'];

  /**
   * 計算運費
   * @param subtotal 訂單小計
   * @param city 配送城市
   */
  static calculateShippingFee(subtotal: number, city: string): number {
    // 滿額免運
    if (subtotal >= this.FREE_SHIPPING_THRESHOLD) {
      return 0;
    }

    // 偏遠地區加收運費
    const isRemoteArea = this.REMOTE_AREAS.some((area) => city.includes(area));

    return isRemoteArea
      ? this.BASE_SHIPPING_FEE + this.REMOTE_AREA_SURCHARGE
      : this.BASE_SHIPPING_FEE;
  }

  /**
   * 計算稅費
   * 台灣目前食品類商品免營業稅，這裡預留稅費計算邏輯
   * @param _subtotal 訂單小計（預留參數，未來可能需要）
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static calculateTax(_subtotal: number): number {
    return 0;
  }

  /**
   * 計算訂單總金額
   */
  static calculateTotal(
    subtotal: number,
    shippingFee: number,
    tax: number,
  ): number {
    return subtotal + shippingFee + tax;
  }

  /**
   * 檢查是否符合免運條件
   */
  static isFreeShipping(subtotal: number): boolean {
    return subtotal >= this.FREE_SHIPPING_THRESHOLD;
  }

  /**
   * 取得免運門檻
   */
  static getFreeShippingThreshold(): number {
    return this.FREE_SHIPPING_THRESHOLD;
  }

  /**
   * 取得基本運費
   */
  static getBaseShippingFee(): number {
    return this.BASE_SHIPPING_FEE;
  }
}
