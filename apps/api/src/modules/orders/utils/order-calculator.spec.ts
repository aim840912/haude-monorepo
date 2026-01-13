import { OrderCalculator } from './order-calculator';

describe('OrderCalculator', () => {
  describe('calculateShippingFee', () => {
    describe('免運門檻測試', () => {
      it('未滿 1000 元應收取基本運費 60 元', () => {
        expect(OrderCalculator.calculateShippingFee(500, '台北市')).toBe(60);
        expect(OrderCalculator.calculateShippingFee(0, '台北市')).toBe(60);
      });

      it('滿 1000 元應免運費', () => {
        expect(OrderCalculator.calculateShippingFee(1500, '台北市')).toBe(0);
        expect(OrderCalculator.calculateShippingFee(2000, '新北市')).toBe(0);
      });

      it('邊界：剛好 1000 元應免運費', () => {
        expect(OrderCalculator.calculateShippingFee(1000, '台北市')).toBe(0);
      });

      it('邊界：999 元應收取運費', () => {
        expect(OrderCalculator.calculateShippingFee(999, '台北市')).toBe(60);
      });
    });

    describe('偏遠地區測試', () => {
      it('離島地區應加收 40 元（總共 100 元）', () => {
        expect(OrderCalculator.calculateShippingFee(500, '離島')).toBe(100);
        expect(OrderCalculator.calculateShippingFee(500, '澎湖離島')).toBe(100);
        expect(OrderCalculator.calculateShippingFee(500, '金門離島')).toBe(100);
      });

      it('山區應加收 40 元（總共 100 元）', () => {
        expect(OrderCalculator.calculateShippingFee(500, '山區')).toBe(100);
        expect(OrderCalculator.calculateShippingFee(500, '某某山區')).toBe(100);
      });

      it('偏遠地區但滿 1000 元仍免運', () => {
        expect(OrderCalculator.calculateShippingFee(1000, '離島')).toBe(0);
        expect(OrderCalculator.calculateShippingFee(1500, '山區')).toBe(0);
      });

      it('一般地區不加收額外運費', () => {
        expect(OrderCalculator.calculateShippingFee(500, '台北市')).toBe(60);
        expect(OrderCalculator.calculateShippingFee(500, '高雄市')).toBe(60);
        expect(OrderCalculator.calculateShippingFee(500, '花蓮縣')).toBe(60);
      });
    });
  });

  describe('calculateTax', () => {
    it('食品類商品免營業稅，應回傳 0', () => {
      expect(OrderCalculator.calculateTax(0)).toBe(0);
      expect(OrderCalculator.calculateTax(500)).toBe(0);
      expect(OrderCalculator.calculateTax(10000)).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    it('應正確計算總金額 = 小計 + 運費 + 稅', () => {
      expect(OrderCalculator.calculateTotal(500, 60, 0)).toBe(560);
      expect(OrderCalculator.calculateTotal(1000, 0, 0)).toBe(1000);
      expect(OrderCalculator.calculateTotal(800, 100, 0)).toBe(900);
    });

    it('免運時總金額 = 小計 + 稅', () => {
      expect(OrderCalculator.calculateTotal(1500, 0, 0)).toBe(1500);
    });

    it('如果未來有稅，應正確計算', () => {
      // 預留測試：假設未來有 5% 營業稅
      expect(OrderCalculator.calculateTotal(1000, 60, 50)).toBe(1110);
    });
  });

  describe('isFreeShipping', () => {
    it('1000 元以上應回傳 true', () => {
      expect(OrderCalculator.isFreeShipping(1000)).toBe(true);
      expect(OrderCalculator.isFreeShipping(1001)).toBe(true);
      expect(OrderCalculator.isFreeShipping(5000)).toBe(true);
    });

    it('未滿 1000 元應回傳 false', () => {
      expect(OrderCalculator.isFreeShipping(999)).toBe(false);
      expect(OrderCalculator.isFreeShipping(0)).toBe(false);
      expect(OrderCalculator.isFreeShipping(500)).toBe(false);
    });
  });

  describe('getFreeShippingThreshold', () => {
    it('應回傳免運門檻 1000', () => {
      expect(OrderCalculator.getFreeShippingThreshold()).toBe(1000);
    });
  });

  describe('getBaseShippingFee', () => {
    it('應回傳基本運費 60', () => {
      expect(OrderCalculator.getBaseShippingFee()).toBe(60);
    });
  });
});
