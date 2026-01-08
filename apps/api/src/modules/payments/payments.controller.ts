import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto';
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
