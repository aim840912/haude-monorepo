import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  OrderResponseDto,
  PaginatedResponseDto,
  ErrorResponseDto,
} from '@/common/dto/response.dto';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto } from './dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtUser } from '@/modules/auth/strategies/jwt.strategy';

// ========================================
// 使用者訂單 API
// ========================================

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '取得使用者訂單列表' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({
    status: 200,
    description: '成功取得訂單列表',
    type: PaginatedResponseDto<OrderResponseDto>,
  })
  @ApiResponse({ status: 401, description: '未認證', type: ErrorResponseDto })
  getUserOrders(
    @Request() req: { user: JwtUser },
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.ordersService.getUserOrders(req.user.userId, limit, offset);
  }

  @Post()
  @ApiOperation({ summary: '建立訂單' })
  @ApiResponse({
    status: 201,
    description: '訂單建立成功',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '請求參數錯誤或庫存不足',
    type: ErrorResponseDto,
  })
  @ApiResponse({ status: 401, description: '未認證', type: ErrorResponseDto })
  createOrder(@Request() req: { user: JwtUser }, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: '取得訂單詳情' })
  @ApiResponse({
    status: 200,
    description: '成功取得訂單',
    type: OrderResponseDto,
  })
  @ApiResponse({ status: 401, description: '未認證', type: ErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: '訂單不存在或無權限查看',
    type: ErrorResponseDto,
  })
  getOrderById(
    @Request() req: { user: JwtUser },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.ordersService.getOrderById(id, req.user.userId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: '取消訂單' })
  @ApiResponse({
    status: 200,
    description: '訂單取消成功',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '訂單狀態無法取消',
    type: ErrorResponseDto,
  })
  @ApiResponse({ status: 401, description: '未認證', type: ErrorResponseDto })
  @ApiResponse({
    status: 404,
    description: '訂單不存在或無權限',
    type: ErrorResponseDto,
  })
  cancelOrder(
    @Request() req: { user: JwtUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(id, req.user.userId, dto);
  }
}

// ========================================
// 管理員訂單 API (STAFF 和 ADMIN 可存取)
// ========================================

@ApiTags('admin/orders')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
@ApiBearerAuth()
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '取得所有訂單（管理員）' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, description: '成功取得所有訂單' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  getAllOrders(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.ordersService.getAllOrders(limit, offset);
  }

  @Get('stats')
  @ApiOperation({ summary: '取得訂單統計（管理員）' })
  @ApiResponse({ status: 200, description: '成功取得統計' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  getOrderStats() {
    return this.ordersService.getOrderStats();
  }

  @Get(':id')
  @ApiOperation({ summary: '取得訂單詳情（管理員）' })
  @ApiResponse({ status: 200, description: '成功取得訂單詳情' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '訂單不存在' })
  getOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrderByIdForAdmin(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新訂單狀態（管理員）' })
  @ApiResponse({ status: 200, description: '訂單更新成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '訂單不存在' })
  updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto);
  }
}

// ========================================
// 儀表板統計 API (STAFF 和 ADMIN 可存取)
// ========================================

@ApiTags('admin/dashboard')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('revenue-trend')
  @ApiOperation({ summary: '取得營收趨勢（儀表板）' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['day', 'week', 'month'],
    example: 'day',
  })
  @ApiResponse({ status: 200, description: '成功取得營收趨勢' })
  getRevenueTrend(@Query('period') period: 'day' | 'week' | 'month' = 'day') {
    return this.ordersService.getRevenueTrend(period);
  }

  @Get('order-status')
  @ApiOperation({ summary: '取得訂單狀態分布（儀表板）' })
  @ApiResponse({ status: 200, description: '成功取得訂單狀態分布' })
  getOrderStatusDistribution() {
    return this.ordersService.getOrderStatusDistribution();
  }

  @Get('top-products')
  @ApiOperation({ summary: '取得熱銷產品（儀表板）' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: '成功取得熱銷產品' })
  getTopProducts(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.ordersService.getTopProducts(limit);
  }
}
