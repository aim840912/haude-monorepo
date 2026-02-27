import { SetMetadata } from '@nestjs/common';

/**
 * Audit Log Action Types
 *
 * Standard action verbs for audit trail tracking.
 */
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'IMPORT'
  | 'STATUS_CHANGE';

/**
 * Metadata stored on the route handler for the interceptor to read.
 */
export interface AuditLogMetadata {
  action: AuditAction;
  resource: string;
  /** Optional: extract resourceId from a different param (default: 'id') */
  idParam?: string;
}

export const AUDIT_LOG_KEY = 'audit_log';

/**
 * @AuditLog Decorator
 *
 * Marks an endpoint for automatic audit logging.
 * Works with AuditLogInterceptor to capture admin operations.
 *
 * @example
 * @AuditLog('CREATE', 'products')
 * @Post()
 * async createProduct(@Body() dto: CreateProductDto) { ... }
 *
 * @example
 * @AuditLog('UPDATE', 'orders', 'orderId')
 * @Patch(':orderId/status')
 * async updateOrderStatus(...) { ... }
 */
export const AuditLog = (
  action: AuditAction,
  resource: string,
  idParam?: string,
): MethodDecorator =>
  SetMetadata(AUDIT_LOG_KEY, {
    action,
    resource,
    idParam,
  } satisfies AuditLogMetadata);
