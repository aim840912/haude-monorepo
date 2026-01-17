import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiException, ErrorCode } from '../exceptions';

/**
 * 統一錯誤回應介面
 */
interface ErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  timestamp: string;
  path: string;
}

/**
 * 全域異常過濾器
 * 攔截所有異常並統一格式化回應
 *
 * 處理順序：
 * 1. 自訂 ApiException - 使用內建的 errorCode
 * 2. NestJS HttpException - 轉換為通用錯誤格式
 * 3. 未知錯誤 - 統一為 500 內部錯誤
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, errorCode, message } = this.extractErrorInfo(exception);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      errorCode: errorCode,
      message: message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 記錄錯誤 - 5xx 錯誤使用 error 級別，其他使用 warn
    if (status >= 500) {
      this.logger.error(
        `[${errorCode}] ${message} - ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(`[${errorCode}] ${message} - ${request.method} ${request.url}`);
    }

    response.status(status).json(errorResponse);
  }

  /**
   * 從異常中提取錯誤資訊
   */
  private extractErrorInfo(exception: unknown): {
    status: number;
    errorCode: string;
    message: string;
  } {
    // 1. 處理自訂 ApiException
    if (exception instanceof ApiException) {
      return {
        status: exception.getStatus(),
        errorCode: exception.errorCode,
        message: exception.message,
      };
    }

    // 2. 處理 NestJS HttpException（包含內建異常）
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // 處理 ValidationPipe 的驗證錯誤
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const response = exceptionResponse as Record<string, unknown>;

        // class-validator 的錯誤格式
        if (Array.isArray(response.message)) {
          return {
            status,
            errorCode: ErrorCode.VALIDATION_ERROR,
            message: (response.message as string[]).join('; '),
          };
        }

        return {
          status,
          errorCode: this.mapStatusToErrorCode(status),
          message:
            typeof response.message === 'string' ? response.message : exception.message,
        };
      }

      return {
        status,
        errorCode: this.mapStatusToErrorCode(status),
        message:
          typeof exceptionResponse === 'string' ? exceptionResponse : exception.message,
      };
    }

    // 3. 處理未知錯誤
    const message =
      exception instanceof Error ? exception.message : '伺服器發生未預期的錯誤';

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCode.INTERNAL_ERROR,
      message,
    };
  }

  /**
   * 將 HTTP 狀態碼映射到預設錯誤代碼
   */
  private mapStatusToErrorCode(status: number): string {
    const statusCodeMap: Record<number, string> = {
      400: ErrorCode.VALIDATION_ERROR,
      401: ErrorCode.UNAUTHORIZED,
      403: ErrorCode.FORBIDDEN,
      404: ErrorCode.NOT_FOUND,
      409: ErrorCode.RESOURCE_CONFLICT,
      422: ErrorCode.INVALID_INPUT,
      429: ErrorCode.RATE_LIMIT_EXCEEDED,
      500: ErrorCode.INTERNAL_ERROR,
    };

    return statusCodeMap[status] || ErrorCode.INTERNAL_ERROR;
  }
}
