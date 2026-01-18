import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductsService } from './products.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase';
import {
  createMockPrismaService,
  createMockSupabaseService,
  createMockProduct,
} from '../../../test/utils/test-helpers';

// Mock uuid 模組 (避免 ES modules 問題)
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
}));

describe('ProductsService', () => {
  let service: ProductsService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;
  let mockSupabaseService: ReturnType<typeof createMockSupabaseService>;

  beforeEach(async () => {
    mockPrismaService = createMockPrismaService();
    mockSupabaseService = createMockSupabaseService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('應回傳所有啟用且非草稿的產品', async () => {
      const mockProducts = [
        createMockProduct(),
        createMockProduct({ id: 'product-2', name: '產品2' }),
      ];
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, isDraft: false },
        }),
      );
    });
  });

  describe('findAllAdmin', () => {
    it('應回傳所有產品（預設不含草稿）', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        createMockProduct(),
      ]);

      await service.findAllAdmin();

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isDraft: false },
        }),
      );
    });

    it('includeDrafts=true 時應包含草稿', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        createMockProduct(),
      ]);

      await service.findAllAdmin(true);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });

  describe('findOne', () => {
    it('應回傳單一產品', async () => {
      const mockProduct = createMockProduct();
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('product-1');

      expect(result.id).toBe('product-1');
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
        }),
      );
    });

    it('產品不存在時應拋出 NotFoundException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getCategories', () => {
    it('應回傳不重複的分類列表', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { category: '茶葉' },
        { category: '茶具' },
        { category: '禮盒' },
      ]);

      const result = await service.getCategories();

      expect(result).toEqual(['禮盒', '茶具', '茶葉']); // 按字母排序
    });
  });

  describe('checkNameExists', () => {
    it('名稱存在時應回傳 exists: true', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(
        createMockProduct(),
      );

      const result = await service.checkNameExists('測試產品');

      expect(result.exists).toBe(true);
    });

    it('名稱不存在時應回傳 exists: false', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      const result = await service.checkNameExists('不存在的產品');

      expect(result.exists).toBe(false);
    });

    it('應排除指定 ID 的產品（用於更新時檢查）', async () => {
      mockPrismaService.product.findFirst.mockResolvedValue(null);

      await service.checkNameExists('測試產品', 'product-1');

      expect(mockPrismaService.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'product-1' },
          }),
        }),
      );
    });
  });

  describe('getInventoryStatus', () => {
    it('應回傳正確的庫存狀態', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        stock: 100,
        reservedStock: 20,
      });

      const result = await service.getInventoryStatus('product-1');

      expect(result.stock).toBe(100);
      expect(result.reserved).toBe(20);
      expect(result.available).toBe(80);
      expect(result.canPurchase).toBe(true);
      expect(result.reservedPercentage).toBe(20);
    });

    it('庫存為 0 時 canPurchase 應為 false', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        stock: 10,
        reservedStock: 10,
      });

      const result = await service.getInventoryStatus('product-1');

      expect(result.available).toBe(0);
      expect(result.canPurchase).toBe(false);
    });

    it('產品不存在時應拋出 NotFoundException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getInventoryStatus('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createDraft', () => {
    it('應建立草稿產品', async () => {
      const draftProduct = createMockProduct({
        name: '新產品',
        isDraft: true,
        isActive: false,
      });
      mockPrismaService.product.create.mockResolvedValue(draftProduct);

      const result = await service.createDraft();

      expect(result.isDraft).toBe(true);
      expect(result.isActive).toBe(false);
      expect(mockPrismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isDraft: true,
            isActive: false,
          }),
        }),
      );
    });
  });

  describe('create', () => {
    const createDto = {
      name: '新產品',
      description: '描述',
      category: '茶葉',
      price: 500,
      priceUnit: '75g',
      stock: 100,
    };

    it('應成功建立產品', async () => {
      mockPrismaService.product.create.mockResolvedValue(
        createMockProduct({ ...createDto }),
      );

      const result = await service.create(createDto);

      expect(result.name).toBe(createDto.name);
      expect(mockPrismaService.product.create).toHaveBeenCalled();
    });

    it('應正確處理促銷設定', async () => {
      const saleDto = {
        ...createDto,
        isOnSale: true,
        originalPrice: 600,
        saleEndDate: '2024-12-31',
      };
      mockPrismaService.product.create.mockResolvedValue(
        createMockProduct({ isOnSale: true }),
      );

      await service.create(saleDto);

      expect(mockPrismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isOnSale: true,
            originalPrice: 600,
          }),
        }),
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      name: '更新的產品名',
      price: 600,
    };

    beforeEach(() => {
      mockPrismaService.product.findUnique.mockResolvedValue(
        createMockProduct(),
      );
    });

    it('應成功更新產品', async () => {
      mockPrismaService.product.update.mockResolvedValue(
        createMockProduct({ ...updateDto }),
      );

      const result = await service.update('product-1', updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-1' },
          data: expect.objectContaining({
            name: updateDto.name,
            price: updateDto.price,
          }),
        }),
      );
    });

    it('產品不存在時應拋出 NotFoundException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('應只更新提供的欄位', async () => {
      mockPrismaService.product.update.mockResolvedValue(createMockProduct());

      await service.update('product-1', { name: '新名稱' });

      expect(mockPrismaService.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: '新名稱' },
        }),
      );
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      mockPrismaService.product.findUnique.mockResolvedValue(
        createMockProduct(),
      );
    });

    it('應成功刪除產品', async () => {
      mockPrismaService.product.delete.mockResolvedValue(createMockProduct());

      const result = await service.remove('product-1');

      expect(result.message).toBe('產品已刪除');
      expect(mockPrismaService.product.delete).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
    });

    it('產品有訂單記錄時應拋出 BadRequestException', async () => {
      const foreignKeyError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        { code: 'P2003', clientVersion: '5.0.0' },
      );
      mockPrismaService.product.delete.mockRejectedValue(foreignKeyError);

      await expect(service.remove('product-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('softRemove', () => {
    it('應將產品設為非啟用', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(
        createMockProduct(),
      );
      mockPrismaService.product.update.mockResolvedValue(
        createMockProduct({ isActive: false }),
      );

      const result = await service.softRemove('product-1');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false },
        }),
      );
    });
  });

  describe('getUploadUrl', () => {
    it('應回傳簽名上傳 URL', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(
        createMockProduct(),
      );

      const result = await service.getUploadUrl('product-1', 'test.jpg');

      expect(result.uploadUrl).toBeDefined();
      expect(result.filePath).toBeDefined();
      expect(result.publicUrl).toBeDefined();
      expect(mockSupabaseService.createSignedUploadUrl).toHaveBeenCalled();
    });

    it('產品不存在時應拋出 NotFoundException', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.getUploadUrl('non-existent', 'test.jpg'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addImage', () => {
    const createImageDto = () => ({
      storageUrl: 'https://example.com/image.jpg',
      filePath: 'product-1/image.jpg',
      altText: '產品圖片',
    });

    beforeEach(() => {
      mockPrismaService.product.findUnique.mockResolvedValue(
        createMockProduct(),
      );
    });

    it('應成功新增產品圖片', async () => {
      const imageDto = createImageDto();
      mockPrismaService.productImage.aggregate.mockResolvedValue({
        _max: { displayPosition: 2 },
      });
      mockPrismaService.productImage.create.mockResolvedValue({
        id: 'image-1',
        ...imageDto,
        displayPosition: 3,
      });

      const result = await service.addImage('product-1', imageDto);

      expect(result.displayPosition).toBe(3);
    });

    it('第一張圖片的 displayPosition 應為 0', async () => {
      const imageDto = createImageDto();
      mockPrismaService.productImage.aggregate.mockResolvedValue({
        _max: { displayPosition: null },
      });
      mockPrismaService.productImage.create.mockResolvedValue({
        id: 'image-1',
        ...imageDto,
        displayPosition: 0,
      });

      await service.addImage('product-1', imageDto);

      expect(mockPrismaService.productImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            displayPosition: 0,
          }),
        }),
      );
    });
  });

  describe('removeImage', () => {
    beforeEach(() => {
      mockPrismaService.productImage.findFirst.mockResolvedValue({
        id: 'image-1',
        filePath: 'product-1/image.jpg',
      });
    });

    it('應刪除圖片並從 Storage 移除檔案', async () => {
      mockPrismaService.productImage.delete.mockResolvedValue({});

      const result = await service.removeImage('product-1', 'image-1');

      expect(result.message).toBe('圖片已刪除');
      expect(mockSupabaseService.deleteFile).toHaveBeenCalled();
      expect(mockPrismaService.productImage.delete).toHaveBeenCalled();
    });

    it('圖片不存在時應拋出 NotFoundException', async () => {
      mockPrismaService.productImage.findFirst.mockResolvedValue(null);

      await expect(
        service.removeImage('product-1', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('Storage 刪除失敗時仍應刪除資料庫記錄', async () => {
      mockSupabaseService.deleteFile.mockRejectedValue(
        new Error('Storage error'),
      );
      mockPrismaService.productImage.delete.mockResolvedValue({});

      const result = await service.removeImage('product-1', 'image-1');

      expect(result.message).toBe('圖片已刪除');
      expect(mockPrismaService.productImage.delete).toHaveBeenCalled();
    });
  });

  describe('reorderImages', () => {
    it('應正確重新排序圖片', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(
        createMockProduct(),
      );
      mockPrismaService.$transaction.mockResolvedValue([]);
      mockPrismaService.productImage.findMany.mockResolvedValue([
        { id: 'image-2', displayPosition: 0 },
        { id: 'image-1', displayPosition: 1 },
      ]);

      const result = await service.reorderImages('product-1', [
        'image-2',
        'image-1',
      ]);

      expect(Array.isArray(result)).toBe(true);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });
});
