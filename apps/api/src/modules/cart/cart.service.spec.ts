import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;

  // Mock 產品
  const mockProduct = {
    id: 'product-1',
    name: '測試茶葉',
    price: 500,
    priceUnit: '斤',
    stock: 100,
    reservedStock: 10,
    isActive: true,
    images: [{ storageUrl: 'https://example.com/image.jpg' }],
  };

  // Mock 購物車
  const mockCart = {
    id: 'cart-1',
    userId: 'user-123',
    items: [],
  };

  // Mock Prisma
  const mockPrismaService = {
    product: {
      findUnique: jest.fn(),
    },
    cart: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    cartItem: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);

    // 清除所有 mock
    jest.clearAllMocks();
  });

  describe('addItem', () => {
    const userId = 'user-123';
    const addItemDto = { productId: 'product-1', quantity: 2 };

    describe('庫存檢查', () => {
      it('產品不存在應拋出 NotFoundException', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(null);

        await expect(service.addItem(userId, addItemDto)).rejects.toThrow(
          NotFoundException,
        );
      });

      it('產品已下架應拋出 BadRequestException', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({
          ...mockProduct,
          isActive: false,
        });

        await expect(service.addItem(userId, addItemDto)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('可用庫存為 0 應拋出 BadRequestException', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({
          ...mockProduct,
          stock: 10,
          reservedStock: 10, // 可用 = 10 - 10 = 0
        });

        await expect(service.addItem(userId, addItemDto)).rejects.toThrow(
          BadRequestException,
        );
      });

      it('可用庫存 = stock - reservedStock', async () => {
        // stock: 100, reservedStock: 10 → 可用: 90
        mockPrismaService.product.findUnique.mockResolvedValue({
          id: 'product-1',
          stock: 100,
          reservedStock: 10,
          isActive: true,
        });
        // 第一次呼叫（getOrCreateCart）
        mockPrismaService.cart.findUnique
          .mockResolvedValueOnce({
            ...mockCart,
            items: [],
          })
          // 第二次呼叫（getCart 回傳結果）
          .mockResolvedValueOnce({
            ...mockCart,
            items: [
              {
                id: 'item-1',
                productId: 'product-1',
                quantity: 2,
                product: mockProduct,
              },
            ],
          });
        mockPrismaService.cartItem.create.mockResolvedValue({});

        const result = await service.addItem(userId, addItemDto);

        // 應該成功（因為可用庫存 90 > 0）
        expect(mockPrismaService.cartItem.create).toHaveBeenCalled();
      });
    });

    describe('數量處理', () => {
      it('購物車中已有商品應更新數量', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({
          id: 'product-1',
          stock: 100,
          reservedStock: 0,
          isActive: true,
        });
        mockPrismaService.cart.findUnique.mockResolvedValue({
          ...mockCart,
          items: [
            {
              id: 'existing-item',
              productId: 'product-1',
              quantity: 3,
              product: mockProduct,
            },
          ],
        });
        mockPrismaService.cartItem.update.mockResolvedValue({});

        await service.addItem(userId, { productId: 'product-1', quantity: 2 });

        // 應該更新而非建立
        expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
          where: { id: 'existing-item' },
          data: { quantity: 5 }, // 3 + 2 = 5
        });
        expect(mockPrismaService.cartItem.create).not.toHaveBeenCalled();
      });

      it('購物車中無商品應新增', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({
          id: 'product-1',
          stock: 100,
          reservedStock: 0,
          isActive: true,
        });
        mockPrismaService.cart.findUnique.mockResolvedValue({
          ...mockCart,
          items: [], // 空購物車
        });
        mockPrismaService.cartItem.create.mockResolvedValue({});

        await service.addItem(userId, { productId: 'product-1', quantity: 2 });

        expect(mockPrismaService.cartItem.create).toHaveBeenCalledWith({
          data: {
            cartId: mockCart.id,
            productId: 'product-1',
            quantity: 2,
          },
        });
      });

      it('數量不應超過可用庫存', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({
          id: 'product-1',
          stock: 5,
          reservedStock: 0, // 可用: 5
          isActive: true,
        });
        mockPrismaService.cart.findUnique.mockResolvedValue({
          ...mockCart,
          items: [],
        });
        mockPrismaService.cartItem.create.mockResolvedValue({});

        await service.addItem(userId, { productId: 'product-1', quantity: 10 }); // 要買 10 但只有 5

        expect(mockPrismaService.cartItem.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            quantity: 5, // 應該被限制為 5
          }),
        });
      });

      it('累加後數量超過庫存應限制為最大可用量', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue({
          id: 'product-1',
          stock: 10,
          reservedStock: 0, // 可用: 10
          isActive: true,
        });
        mockPrismaService.cart.findUnique.mockResolvedValue({
          ...mockCart,
          items: [
            {
              id: 'existing-item',
              productId: 'product-1',
              quantity: 8, // 已有 8 個
              product: mockProduct,
            },
          ],
        });
        mockPrismaService.cartItem.update.mockResolvedValue({});

        await service.addItem(userId, { productId: 'product-1', quantity: 5 }); // 要再加 5，但 8+5=13 > 10

        expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
          where: { id: 'existing-item' },
          data: { quantity: 10 }, // 應該被限制為 10
        });
      });
    });
  });

  describe('updateItemQuantity', () => {
    const userId = 'user-123';
    const productId = 'product-1';

    it('購物車中無此商品應拋出 NotFoundException', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [], // 空購物車
      });

      await expect(
        service.updateItemQuantity(userId, productId, { quantity: 5 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('更新數量不應超過可用庫存', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [
          {
            id: 'item-1',
            productId,
            quantity: 2,
            product: mockProduct,
          },
        ],
      });
      mockPrismaService.product.findUnique.mockResolvedValue({
        stock: 10,
        reservedStock: 3, // 可用: 7
      });
      mockPrismaService.cartItem.update.mockResolvedValue({});

      await service.updateItemQuantity(userId, productId, { quantity: 20 }); // 要更新為 20，但只有 7

      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 7 }, // 應該被限制為 7
      });
    });

    it('應正確更新數量', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [
          {
            id: 'item-1',
            productId,
            quantity: 2,
            product: mockProduct,
          },
        ],
      });
      mockPrismaService.product.findUnique.mockResolvedValue({
        stock: 100,
        reservedStock: 0,
      });
      mockPrismaService.cartItem.update.mockResolvedValue({});

      await service.updateItemQuantity(userId, productId, { quantity: 5 });

      expect(mockPrismaService.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantity: 5 },
      });
    });
  });

  describe('getCart', () => {
    const userId = 'user-123';

    it('無購物車應自動建立', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      mockPrismaService.cart.create.mockResolvedValue({
        id: 'new-cart',
        userId,
        items: [],
      });

      const result = await service.getCart(userId);

      expect(mockPrismaService.cart.create).toHaveBeenCalled();
      expect(result.items).toEqual([]);
    });

    it('應正確計算 totalItems', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId,
        items: [
          { id: 'item-1', productId: 'p1', quantity: 2, product: mockProduct },
          { id: 'item-2', productId: 'p2', quantity: 3, product: mockProduct },
        ],
      });

      const result = await service.getCart(userId);

      expect(result.totalItems).toBe(5); // 2 + 3
    });

    it('應正確計算 totalPrice', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId,
        items: [
          {
            id: 'item-1',
            productId: 'p1',
            quantity: 2,
            product: { ...mockProduct, price: 500 },
          },
          {
            id: 'item-2',
            productId: 'p2',
            quantity: 3,
            product: { ...mockProduct, price: 300 },
          },
        ],
      });

      const result = await service.getCart(userId);

      // 500*2 + 300*3 = 1000 + 900 = 1900
      expect(result.totalPrice).toBe(1900);
    });

    it('應正確計算各項 subtotal', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId,
        items: [
          {
            id: 'item-1',
            productId: 'p1',
            quantity: 2,
            product: { ...mockProduct, price: 500 },
          },
        ],
      });

      const result = await service.getCart(userId);

      expect(result.items[0].subtotal).toBe(1000); // 500 * 2
    });
  });

  describe('removeItem', () => {
    const userId = 'user-123';
    const productId = 'product-1';

    it('購物車中無此商品應拋出 NotFoundException', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [],
      });

      await expect(service.removeItem(userId, productId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('應成功刪除商品', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        ...mockCart,
        items: [
          {
            id: 'item-1',
            productId,
            quantity: 2,
            product: mockProduct,
          },
        ],
      });
      mockPrismaService.cartItem.delete.mockResolvedValue({});

      await service.removeItem(userId, productId);

      expect(mockPrismaService.cartItem.delete).toHaveBeenCalledWith({
        where: { id: 'item-1' },
      });
    });
  });

  describe('clearCart', () => {
    const userId = 'user-123';

    it('無購物車應回傳空結果', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);

      const result = await service.clearCart(userId);

      expect(result.items).toEqual([]);
      expect(result.totalItems).toBe(0);
      expect(result.totalPrice).toBe(0);
    });

    it('應刪除所有購物車商品', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({
        id: 'cart-1',
        userId,
      });
      mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.clearCart(userId);

      expect(mockPrismaService.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cartId: 'cart-1' },
      });
      expect(result.message).toBe('購物車已清空');
    });
  });
});
