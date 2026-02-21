import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Res,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { NoCache } from '@/common/decorators/cacheable.decorator';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto, RefundPaymentDto, ConfirmManualRefundDto } from './dto';
import { ConfigService } from '@nestjs/config';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string };
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
  }

  // ========================================
  // 使用者端 API
  // ========================================

  /**
   * 建立付款請求
   *
   * 回傳前端需要的表單資料，前端收到後自動提交到綠界
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '建立付款請求' })
  @ApiResponse({ status: 201, description: '成功建立付款' })
  @ApiResponse({ status: 400, description: '訂單狀態無法付款' })
  @ApiResponse({ status: 404, description: '訂單不存在' })
  async createPayment(
    @Body() dto: CreatePaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const result = await this.paymentsService.createPayment(
      dto.orderId,
      req.user.userId,
      dto.paymentMethod,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * 查詢付款狀態
   */
  @Get(':orderId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '查詢付款狀態' })
  @ApiResponse({ status: 200, description: '成功取得狀態' })
  @ApiResponse({ status: 404, description: '訂單不存在' })
  async getPaymentStatus(
    @Param('orderId') orderId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const status = await this.paymentsService.getPaymentStatus(
      orderId,
      req.user.userId,
    );

    return {
      success: true,
      data: status,
    };
  }

  // ========================================
  // 綠界回調端點
  // ========================================

  /**
   * 綠界付款通知（Webhook）
   *
   * 綠界會在付款完成後呼叫此端點
   * 不需要認證，但會驗證 CheckMacValue
   */
  @Post('ecpay/notify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '綠界付款通知（Webhook）' })
  @ApiResponse({ status: 200, description: '處理成功' })
  async handleNotify(
    @Body() body: Record<string, string>,
    @Req() req: Request,
  ) {
    this.logger.log('收到綠界付款通知');

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket?.remoteAddress;

    const success = await this.paymentsService.handleNotify(body, ipAddress);

    // 綠界要求回傳 1|OK 表示成功
    return success ? '1|OK' : '0|FAIL';
  }

  /**
   * 綠界取號結果通知（ATM/CVS）
   *
   * ATM 和 CVS 付款會先回調這個端點告知取號結果
   * 包含虛擬帳號、銀行代碼、繳費代碼等資訊
   */
  @Post('ecpay/info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '綠界取號結果通知（ATM/CVS）' })
  @ApiResponse({ status: 200, description: '處理成功' })
  async handlePaymentInfo(
    @Body() body: Record<string, string>,
    @Req() req: Request,
  ) {
    this.logger.log('收到綠界取號通知');

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket?.remoteAddress;

    const success = await this.paymentsService.handlePaymentInfo(
      body,
      ipAddress,
    );

    return success ? '1|OK' : '0|FAIL';
  }

  /**
   * 綠界付款返回頁
   *
   * 用戶付款完成後會被導向到這裡
   * 然後重定向到前端結果頁
   */
  @Post('ecpay/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '綠界付款返回' })
  async handleReturn(
    @Body() body: Record<string, string>,
    @Res() res: Response,
  ) {
    this.logger.log('用戶從綠界返回');

    const result = await this.paymentsService.handleReturn(body);

    // 重定向到前端結果頁
    const redirectUrl = result.success
      ? `${this.frontendUrl}/orders/${result.orderId}?payment=success`
      : `${this.frontendUrl}/payment-result?status=fail&message=${encodeURIComponent(result.message || '付款失敗')}`;

    return res.redirect(redirectUrl);
  }
}

// ========================================
// 管理員付款 API (STAFF 和 ADMIN 可存取)
// ========================================

@ApiTags('admin/payments')
@Controller('admin/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.STAFF, Role.ADMIN)
@ApiBearerAuth()
@NoCache()
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: '取得所有付款記錄（管理員）' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, description: '成功取得付款記錄' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  getAllPayments(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.paymentsService.getAllPayments(limit, offset);
  }

  @Get('logs')
  @ApiOperation({ summary: '取得付款日誌（管理員）' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  @ApiResponse({ status: 200, description: '成功取得付款日誌' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  getPaymentLogs(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.paymentsService.getPaymentLogs(limit, offset);
  }

  @Get('stats')
  @ApiOperation({ summary: '取得付款統計（管理員）' })
  @ApiResponse({ status: 200, description: '成功取得統計' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  // ========================================
  // 退款端點
  // ========================================

  @Post('refund')
  @ApiOperation({ summary: '執行退款（管理員）' })
  @ApiResponse({ status: 201, description: '退款已處理' })
  @ApiResponse({ status: 400, description: '退款條件不符' })
  @ApiResponse({ status: 404, description: '付款記錄不存在' })
  processRefund(
    @Body() dto: RefundPaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.processRefund(
      dto.paymentId,
      req.user.userId,
      dto.type,
      dto.amount,
      dto.reason,
    );
  }

  @Post('refund/:id/confirm')
  @ApiOperation({ summary: '確認人工退款（ATM/CVS）' })
  @ApiResponse({ status: 200, description: '退款已確認' })
  @ApiResponse({ status: 400, description: '退款狀態不允許確認' })
  @ApiResponse({ status: 404, description: '退款記錄不存在' })
  confirmManualRefund(
    @Param('id') refundId: string,
    @Body() dto: ConfirmManualRefundDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.confirmManualRefund(
      refundId,
      req.user.userId,
      dto.notes,
    );
  }

  @Get(':paymentId/refunds')
  @ApiOperation({ summary: '查詢退款記錄' })
  @ApiResponse({ status: 200, description: '成功取得退款記錄' })
  @ApiResponse({ status: 404, description: '付款記錄不存在' })
  getRefundsByPayment(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getRefundsByPayment(paymentId);
  }
}
