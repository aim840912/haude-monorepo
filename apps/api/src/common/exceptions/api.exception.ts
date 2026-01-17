import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@haude/types';

// 重新導出 ErrorCode，讓現有的 import 繼續運作
export { ErrorCode } from '@haude/types';

/**
 * 自訂 API 異常基類
 * 所有業務異常都應繼承此類別
 */
export class ApiException extends HttpException {
  public readonly errorCode: ErrorCode;

  constructor(
    errorCode: ErrorCode,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        errorCode,
        message,
        statusCode,
      },
      statusCode,
    );
    this.errorCode = errorCode;
  }
}

// ==================== 衍生異常類別 ====================

/**
 * 驗證異常 (400)
 */
export class ValidationException extends ApiException {
  constructor(message: string, errorCode: ErrorCode = ErrorCode.VALIDATION_ERROR) {
    super(errorCode, message, HttpStatus.BAD_REQUEST);
  }
}

/**
 * 認證異常 (401)
 */
export class UnauthorizedException extends ApiException {
  constructor(
    message: string = '未授權的請求',
    errorCode: ErrorCode = ErrorCode.UNAUTHORIZED,
  ) {
    super(errorCode, message, HttpStatus.UNAUTHORIZED);
  }
}

/**
 * 權限異常 (403)
 */
export class ForbiddenException extends ApiException {
  constructor(
    message: string = '沒有權限執行此操作',
    errorCode: ErrorCode = ErrorCode.FORBIDDEN,
  ) {
    super(errorCode, message, HttpStatus.FORBIDDEN);
  }
}

/**
 * 資源不存在異常 (404)
 */
export class NotFoundException extends ApiException {
  constructor(resource: string, errorCode: ErrorCode = ErrorCode.NOT_FOUND) {
    super(errorCode, `${resource}不存在`, HttpStatus.NOT_FOUND);
  }
}

/**
 * 資源衝突異常 (409)
 */
export class ConflictException extends ApiException {
  constructor(message: string, errorCode: ErrorCode = ErrorCode.RESOURCE_CONFLICT) {
    super(errorCode, message, HttpStatus.CONFLICT);
  }
}

/**
 * 業務邏輯異常 (422)
 */
export class BusinessException extends ApiException {
  constructor(message: string, errorCode: ErrorCode) {
    super(errorCode, message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

/**
 * 請求限制異常 (429)
 */
export class RateLimitException extends ApiException {
  constructor(message: string = '請求過於頻繁，請稍後再試') {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

/**
 * 伺服器錯誤異常 (500)
 */
export class InternalException extends ApiException {
  constructor(
    message: string = '伺服器內部錯誤',
    errorCode: ErrorCode = ErrorCode.INTERNAL_ERROR,
  ) {
    super(errorCode, message, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
