import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  SearchQueryDto,
  SearchResultItem,
  SearchResponseDto,
} from './dto/search.dto';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * 全站搜尋 - 同時搜尋產品、農場體驗、據點
   */
  async search(dto: SearchQueryDto): Promise<SearchResponseDto> {
    const startTime = Date.now();
    const query = dto.q.toLowerCase().trim();

    if (!query) {
      return {
        results: [],
        total: 0,
        query: dto.q,
        processingTime: Date.now() - startTime,
      };
    }

    const results: SearchResultItem[] = [];

    // 根據 type 過濾決定搜尋哪些類型
    const searchTypes = dto.type || ['product', 'farmTour', 'location'];

    // 並行搜尋各類型
    const [products, farmTours, locations] = await Promise.all([
      searchTypes.includes('product')
        ? this.searchProducts(query, dto)
        : Promise.resolve([]),
      searchTypes.includes('farmTour')
        ? this.searchFarmTours(query)
        : Promise.resolve([]),
      searchTypes.includes('location')
        ? this.searchLocations(query)
        : Promise.resolve([]),
    ]);

    results.push(...products, ...farmTours, ...locations);

    // 按相關性排序
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // 分頁
    const offset = dto.offset || 0;
    const limit = dto.limit || 10;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      results: paginatedResults,
      total: results.length,
      query: dto.q,
      processingTime: Date.now() - startTime,
    };
  }

  /**
   * 搜尋產品
   */
  private async searchProducts(
    query: string,
    dto: SearchQueryDto,
  ): Promise<SearchResultItem[]> {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isDraft: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
        // 價格範圍篩選
        ...(dto.minPrice !== undefined && { price: { gte: dto.minPrice } }),
        ...(dto.maxPrice !== undefined && { price: { lte: dto.maxPrice } }),
        // 類別篩選
        ...(dto.category?.length && { category: { in: dto.category } }),
      },
      include: {
        images: {
          take: 1,
          orderBy: { displayPosition: 'asc' },
        },
      },
      take: 20,
    });

    return products.map((product) => {
      // 計算相關性分數
      const nameMatch = product.name.toLowerCase().includes(query) ? 0.5 : 0;
      const descMatch = product.description?.toLowerCase().includes(query)
        ? 0.3
        : 0;
      const catMatch = product.category?.toLowerCase().includes(query)
        ? 0.2
        : 0;
      const relevanceScore = Math.min(nameMatch + descMatch + catMatch, 1);

      return {
        id: product.id,
        title: product.name,
        description: product.description || '',
        type: 'product' as const,
        url: `/products/${product.id}`,
        category: product.category || undefined,
        image: product.images[0]?.storageUrl || undefined,
        price: Number(product.price),
        rating: undefined, // 可以從 reviews 計算平均評分
        relevanceScore,
      };
    });
  }

  /**
   * 搜尋農場體驗
   */
  private async searchFarmTours(query: string): Promise<SearchResultItem[]> {
    const farmTours = await this.prisma.farmTour.findMany({
      where: {
        isActive: true,
        isDraft: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      include: {
        images: {
          take: 1,
          orderBy: { displayPosition: 'asc' },
        },
      },
      take: 10,
    });

    return farmTours.map((tour) => {
      const nameMatch = tour.name.toLowerCase().includes(query) ? 0.5 : 0;
      const descMatch = tour.description?.toLowerCase().includes(query)
        ? 0.3
        : 0;
      const relevanceScore = Math.min(nameMatch + descMatch, 1);

      return {
        id: tour.id,
        title: tour.name,
        description: tour.description || '',
        type: 'farmTour' as const,
        url: `/farm-tours/${tour.id}`,
        category: '體驗活動',
        image: tour.images[0]?.storageUrl || undefined,
        price: Number(tour.price),
        relevanceScore,
      };
    });
  }

  /**
   * 搜尋據點
   */
  private async searchLocations(query: string): Promise<SearchResultItem[]> {
    const locations = await this.prisma.location.findMany({
      where: {
        isActive: true,
        isDraft: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { features: { has: query } },
          { specialties: { has: query } },
        ],
      },
      include: {
        images: {
          take: 1,
          orderBy: { displayPosition: 'asc' },
        },
      },
      take: 10,
    });

    return locations.map((location) => {
      const nameMatch = location.name.toLowerCase().includes(query) ? 0.5 : 0;
      const addrMatch = location.address?.toLowerCase().includes(query)
        ? 0.3
        : 0;
      const relevanceScore = Math.min(nameMatch + addrMatch, 1);

      return {
        id: location.id,
        title: location.name,
        description: location.address || '',
        type: 'location' as const,
        url: `/locations/${location.id}`,
        category: '據點',
        image: location.images[0]?.storageUrl || undefined,
        relevanceScore,
      };
    });
  }

  /**
   * 取得搜尋建議
   */
  async getSuggestions(query: string): Promise<string[]> {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const suggestions = new Set<string>();

    // 從產品名稱和類別取得建議
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        isDraft: false,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: { name: true, category: true },
      take: 10,
    });

    products.forEach((p) => {
      if (p.name.toLowerCase().includes(lowerQuery)) {
        suggestions.add(p.name);
      }
      if (p.category?.toLowerCase().includes(lowerQuery)) {
        suggestions.add(p.category);
      }
    });

    // 從農場體驗名稱取得建議
    const farmTours = await this.prisma.farmTour.findMany({
      where: {
        isActive: true,
        isDraft: false,
        name: { contains: query, mode: 'insensitive' },
      },
      select: { name: true },
      take: 5,
    });

    farmTours.forEach((t) => suggestions.add(t.name));

    // 從據點名稱取得建議
    const locations = await this.prisma.location.findMany({
      where: {
        isActive: true,
        isDraft: false,
        name: { contains: query, mode: 'insensitive' },
      },
      select: { name: true },
      take: 5,
    });

    locations.forEach((l) => suggestions.add(l.name));

    return Array.from(suggestions).slice(0, 8);
  }

  /**
   * 取得熱門搜尋（暫時返回靜態資料，可以後續整合搜尋日誌）
   */
  async getTrendingSearches(): Promise<string[]> {
    // 暫時返回常見搜尋詞，後續可以從 SearchLog 統計
    // 可以從產品類別中取得
    const categories = await this.prisma.product.findMany({
      where: { isActive: true, isDraft: false },
      select: { category: true },
      distinct: ['category'],
      take: 5,
    });

    const trendingTerms = categories
      .map((c) => c.category)
      .filter((c): c is string => c !== null);

    // 添加一些預設熱門詞
    return [
      ...new Set([...trendingTerms, '茶葉', '禮盒', '體驗', '農場']),
    ].slice(0, 6);
  }
}
