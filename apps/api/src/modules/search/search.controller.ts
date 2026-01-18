import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchSuggestionDto } from './dto/search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * 全站搜尋
   * GET /search?q=茶葉&type=product&limit=10&offset=0
   */
  @Get()
  async search(@Query() dto: SearchQueryDto) {
    return this.searchService.search(dto);
  }

  /**
   * 搜尋建議（自動完成）
   * GET /search/suggestions?q=茶
   */
  @Get('suggestions')
  async getSuggestions(@Query() dto: SearchSuggestionDto) {
    return this.searchService.getSuggestions(dto.q);
  }

  /**
   * 熱門搜尋
   * GET /search/trending
   */
  @Get('trending')
  async getTrendingSearches() {
    return this.searchService.getTrendingSearches();
  }
}
