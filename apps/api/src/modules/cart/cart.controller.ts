import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

/**
 * 購物車 API Controller
 *
 * 所有操作都需要認證，購物車與用戶 1:1 綁定
 */
@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ========================================
  // 查詢 API
  // ========================================

  @Get()
  @ApiOperation({ summary: '取得購物車內容' })
  @ApiResponse({ status: 200, description: '成功取得購物車' })
  @ApiResponse({ status: 401, description: '未認證' })
  getCart(@CurrentUser('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  // ========================================
  // 命令 API
  // ========================================

  @Post('items')
  @ApiOperation({ summary: '新增商品到購物車' })
  @ApiResponse({ status: 201, description: '成功新增商品' })
  @ApiResponse({ status: 400, description: '庫存不足或產品已下架' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 404, description: '產品不存在' })
  addItem(@CurrentUser('userId') userId: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(userId, dto);
  }

  @Put('items/:productId')
  @ApiOperation({ summary: '更新購物車商品數量' })
  @ApiResponse({ status: 200, description: '成功更新數量' })
  @ApiResponse({ status: 400, description: '數量超過庫存' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 404, description: '商品不在購物車中' })
  updateItemQuantity(
    @CurrentUser('userId') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(userId, productId, dto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: '從購物車移除商品' })
  @ApiResponse({ status: 200, description: '成功移除商品' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 404, description: '商品不在購物車中' })
  removeItem(
    @CurrentUser('userId') userId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.cartService.removeItem(userId, productId);
  }

  @Delete()
  @ApiOperation({ summary: '清空購物車' })
  @ApiResponse({ status: 200, description: '購物車已清空' })
  @ApiResponse({ status: 401, description: '未認證' })
  clearCart(@CurrentUser('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
