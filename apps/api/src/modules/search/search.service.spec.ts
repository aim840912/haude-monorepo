import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;

  // Mock Prisma
  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
    },
    farmTour: {
      findMany: jest.fn(),
    },
    location: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);

    jest.clearAllMocks();
  });

  // ========================================
  // 全站搜尋測試
  // ========================================

  describe('search', () => {
    const mockProducts = [
      {
        id: 'product-1',
        name: '高山烏龍茶',
        description: '來自阿里山的高山茶',
        category: '茶葉',
        price: 500,
        images: [{ storageUrl: 'https://example.com/img1.jpg' }],
      },
    ];

    const mockFarmTours = [
      {
        id: 'tour-1',
        name: '採茶體驗',
        description: '親手採茶的樂趣',
        price: 800,
        images: [{ storageUrl: 'https://example.com/tour1.jpg' }],
      },
    ];

    const mockLocations = [
      {
        id: 'location-1',
        name: '南投茶園',
        address: '南投縣名間鄉',
        images: [{ storageUrl: 'https://example.com/loc1.jpg' }],
      },
    ];

    it('空查詢應回傳空結果', async () => {
      const result = await service.search({ q: '   ' });

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.query).toBe('   ');
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('應同時搜尋所有類型', async () => {
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.farmTour.findMany.mockResolvedValue(mockFarmTours);
      mockPrismaService.location.findMany.mockResolvedValue(mockLocations);

      const result = await service.search({ q: '茶' });

      expect(result.total).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(mockPrismaService.product.findMany).toHaveBeenCalled();
      expect(mockPrismaService.farmTour.findMany).toHaveBeenCalled();
      expect(mockPrismaService.location.findMany).toHaveBeenCalled();
    });

    it('應根據 type 過濾搜尋類型', async () => {
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.farmTour.findMany.mockResolvedValue([]);
      mockPrismaService.location.findMany.mockResolvedValue([]);

      const result = await service.search({ q: '茶', type: ['product'] });

      expect(result.results.length).toBeGreaterThanOrEqual(0);
      // 只搜尋產品
      expect(mockPrismaService.product.findMany).toHaveBeenCalled();
    });

    it('應支援分頁', async () => {
      const manyProducts = Array.from({ length: 15 }, (_, i) => ({
        id: `product-${i}`,
        name: `茶葉 ${i}`,
        description: '茶葉描述',
        category: '茶葉',
        price: 100 + i,
        images: [],
      }));

      mockPrismaService.product.findMany.mockResolvedValue(manyProducts);
      mockPrismaService.farmTour.findMany.mockResolvedValue([]);
      mockPrismaService.location.findMany.mockResolvedValue([]);

      const result = await service.search({ q: '茶', limit: 5, offset: 0 });

      expect(result.results).toHaveLength(5);
      expect(result.total).toBe(15);
    });

    it('應按相關性分數排序', async () => {
      const productsWithDifferentRelevance = [
        {
          id: 'product-1',
          name: '普洱茶', // 不含 "烏龍"
          description: '普洱茶描述',
          category: '茶葉',
          price: 100,
          images: [],
        },
        {
          id: 'product-2',
          name: '烏龍茶', // 名稱包含搜尋詞
          description: '烏龍茶描述',
          category: '茶葉',
          price: 200,
          images: [],
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(
        productsWithDifferentRelevance,
      );
      mockPrismaService.farmTour.findMany.mockResolvedValue([]);
      mockPrismaService.location.findMany.mockResolvedValue([]);

      const result = await service.search({ q: '烏龍' });

      // 名稱匹配的應該排在前面
      expect(result.results[0].title).toBe('烏龍茶');
    });

    it('應正確計算結果類型', async () => {
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.farmTour.findMany.mockResolvedValue(mockFarmTours);
      mockPrismaService.location.findMany.mockResolvedValue(mockLocations);

      const result = await service.search({ q: '茶' });

      const types = result.results.map((r) => r.type);
      expect(types).toContain('product');
      expect(types).toContain('farmTour');
      expect(types).toContain('location');
    });

    it('應產生正確的 URL 路徑', async () => {
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.farmTour.findMany.mockResolvedValue(mockFarmTours);
      mockPrismaService.location.findMany.mockResolvedValue(mockLocations);

      const result = await service.search({ q: '茶' });

      const productResult = result.results.find((r) => r.type === 'product');
      const tourResult = result.results.find((r) => r.type === 'farmTour');
      const locationResult = result.results.find((r) => r.type === 'location');

      expect(productResult?.url).toBe('/products/product-1');
      expect(tourResult?.url).toBe('/farm-tours/tour-1');
      expect(locationResult?.url).toBe('/locations/location-1');
    });
  });

  // ========================================
  // 搜尋建議測試
  // ========================================

  describe('getSuggestions', () => {
    it('空查詢應回傳空陣列', async () => {
      const result = await service.getSuggestions('   ');

      expect(result).toEqual([]);
    });

    it('應從產品名稱和類別取得建議', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { name: '高山烏龍茶', category: '茶葉' },
        { name: '阿里山茶', category: '茶葉' },
      ]);
      mockPrismaService.farmTour.findMany.mockResolvedValue([]);
      mockPrismaService.location.findMany.mockResolvedValue([]);

      const result = await service.getSuggestions('茶');

      expect(result).toContain('高山烏龍茶');
      expect(result).toContain('阿里山茶');
    });

    it('應從農場體驗名稱取得建議', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.farmTour.findMany.mockResolvedValue([
        { name: '採茶體驗' },
      ]);
      mockPrismaService.location.findMany.mockResolvedValue([]);

      const result = await service.getSuggestions('採茶');

      expect(result).toContain('採茶體驗');
    });

    it('應從據點名稱取得建議', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.farmTour.findMany.mockResolvedValue([]);
      mockPrismaService.location.findMany.mockResolvedValue([
        { name: '南投茶園' },
      ]);

      const result = await service.getSuggestions('南投');

      expect(result).toContain('南投茶園');
    });

    it('應限制回傳數量為 8 個', async () => {
      mockPrismaService.product.findMany.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({
          name: `產品 ${i}`,
          category: '類別',
        })),
      );
      mockPrismaService.farmTour.findMany.mockResolvedValue([]);
      mockPrismaService.location.findMany.mockResolvedValue([]);

      const result = await service.getSuggestions('產品');

      expect(result.length).toBeLessThanOrEqual(8);
    });

    it('應去除重複建議', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { name: '茶葉', category: '茶葉' }, // 名稱和類別相同
      ]);
      mockPrismaService.farmTour.findMany.mockResolvedValue([]);
      mockPrismaService.location.findMany.mockResolvedValue([]);

      const result = await service.getSuggestions('茶');

      // 去重後應該只有一個
      const teaCount = result.filter((s) => s === '茶葉').length;
      expect(teaCount).toBeLessThanOrEqual(1);
    });
  });

  // ========================================
  // 熱門搜尋測試
  // ========================================

  describe('getTrendingSearches', () => {
    it('應回傳產品類別和預設熱門詞', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { category: '綠茶' },
        { category: '紅茶' },
      ]);

      const result = await service.getTrendingSearches();

      expect(result).toContain('綠茶');
      expect(result).toContain('紅茶');
      // 預設熱門詞
      expect(result).toContain('茶葉');
    });

    it('應限制回傳數量為 6 個', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { category: '類別1' },
        { category: '類別2' },
        { category: '類別3' },
        { category: '類別4' },
        { category: '類別5' },
      ]);

      const result = await service.getTrendingSearches();

      expect(result.length).toBeLessThanOrEqual(6);
    });

    it('應過濾 null 類別', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([
        { category: null },
        { category: '有效類別' },
      ]);

      const result = await service.getTrendingSearches();

      expect(result).not.toContain(null);
      expect(result).toContain('有效類別');
    });
  });
});
