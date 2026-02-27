import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Request } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import {
  AUDIT_LOG_KEY,
  AuditLogMetadata,
} from '../decorators/audit-log.decorator';

interface AuthenticatedUser {
  userId: string;
  email?: string;
  role?: string;
}

/**
 * Audit Log Interceptor
 *
 * Automatically captures admin operations marked with @AuditLog decorator
 * and persists them to the audit_logs table.
 *
 * Flow:
 * 1. Before handler: record start time, read metadata from decorator
 * 2. After handler: extract resource ID from params/response, write audit log
 *
 * Audit logging is fire-and-forget — failures are logged but never
 * block the response to the client.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('AuditLog');

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Read @AuditLog metadata from handler
    const metadata = this.reflector.get<AuditLogMetadata | undefined>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    // No decorator → skip audit logging
    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const startTime = Date.now();

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        const duration = Date.now() - startTime;

        // Fire-and-forget: don't await, don't block response
        this.writeAuditLog(request, metadata, responseBody, duration).catch(
          (err: Error) => {
            this.logger.error(
              `Failed to write audit log: ${err.message}`,
              err.stack,
            );
          },
        );
      }),
    );
  }

  private async writeAuditLog(
    request: Request,
    metadata: AuditLogMetadata,
    responseBody: unknown,
    duration: number,
  ): Promise<void> {
    const user = (request as Request & { user?: AuthenticatedUser }).user;
    if (!user?.userId) {
      // Anonymous request somehow hit an audited endpoint — skip
      this.logger.warn(
        `Audit log skipped: no authenticated user for ${metadata.action} ${metadata.resource}`,
      );
      return;
    }

    // Extract resource ID from route params or response body
    const resourceId = this.extractResourceId(request, responseBody, metadata);

    // Build human-readable summary
    const summary = this.buildSummary(metadata, request.method, resourceId);

    await this.prisma.auditLog.create({
      data: {
        operatorId: user.userId,
        action: metadata.action,
        resource: metadata.resource,
        resourceId,
        summary,
        metadata: this.sanitizeMetadata(request, metadata) as object,
        ipAddress: this.getClientIp(request),
        userAgent: request.headers['user-agent']?.substring(0, 500) || null,
        duration,
      },
    });

    this.logger.log(
      `${metadata.action} ${metadata.resource}${resourceId ? `:${resourceId}` : ''} by ${user.userId} (${duration}ms)`,
    );
  }

  /**
   * Extract resource ID from route params or CREATE response body.
   */
  private extractResourceId(
    request: Request,
    responseBody: unknown,
    metadata: AuditLogMetadata,
  ): string | null {
    const paramName = metadata.idParam || 'id';

    // 1. Try route params (for UPDATE/DELETE)
    const paramId = request.params[paramName];
    if (typeof paramId === 'string') return paramId;

    // 2. For CREATE, try extracting from response body
    if (
      metadata.action === 'CREATE' &&
      responseBody &&
      typeof responseBody === 'object'
    ) {
      const body = responseBody as Record<string, unknown>;
      // Support nested: { data: { id } } or flat: { id }
      const data =
        body.data && typeof body.data === 'object'
          ? (body.data as Record<string, unknown>)
          : body;
      if (typeof data.id === 'string') return data.id;
    }

    return null;
  }

  /**
   * Build a human-readable summary of the operation.
   */
  private buildSummary(
    metadata: AuditLogMetadata,
    method: string,
    resourceId: string | null,
  ): string {
    const target = resourceId
      ? `${metadata.resource}:${resourceId}`
      : metadata.resource;
    return `${metadata.action} ${target} via ${method}`;
  }

  /**
   * Sanitize request data for storage.
   * Strips sensitive fields (passwords, tokens) from body.
   */
  private sanitizeMetadata(
    request: Request,
    metadata: AuditLogMetadata,
  ): Record<string, unknown> {
    const SENSITIVE_FIELDS = [
      'password',
      'token',
      'secret',
      'accessToken',
      'refreshToken',
    ];

    const sanitizedBody =
      request.body && typeof request.body === 'object'
        ? Object.fromEntries(
            Object.entries(request.body as Record<string, unknown>).filter(
              ([key]) =>
                !SENSITIVE_FIELDS.some((f) =>
                  key.toLowerCase().includes(f.toLowerCase()),
                ),
            ),
          )
        : undefined;

    return {
      method: request.method,
      path: request.url,
      action: metadata.action,
      ...(sanitizedBody && Object.keys(sanitizedBody).length > 0
        ? { body: sanitizedBody }
        : {}),
    };
  }

  /**
   * Extract client IP, handling proxies (X-Forwarded-For).
   */
  private getClientIp(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || null;
  }
}
