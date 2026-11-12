import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
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

type Snapshot = Record<string, unknown>;
type SnapshotLoader = (
  prisma: PrismaService,
  id: string,
) => Promise<Snapshot | null>;

// Audit logs are kept for a year, so records holding personal data (address,
// phone, gateway responses) are snapshotted through a field whitelist.
const USER_SNAPSHOT = {
  name: true,
  email: true,
  role: true,
  isActive: true,
  memberLevel: true,
  currentPoints: true,
} as const;

const ORDER_SNAPSHOT = {
  orderNumber: true,
  status: true,
  paymentStatus: true,
  totalAmount: true,
  trackingNumber: true,
} as const;

const REFUND_SNAPSHOT = {
  type: true,
  status: true,
  amount: true,
  reason: true,
  orderId: true,
} as const;

/**
 * How to read the record an UPDATE/DELETE is about to change, keyed by the
 * resource name used in @AuditLog. The snapshot is stored as `metadata.before`
 * and gives the log a readable label — after a DELETE the row is gone, so
 * this is the only chance to record what it was called.
 *
 * Resources not listed here are still logged, just without `before`/`label`.
 */
const SNAPSHOT_LOADERS: Record<string, SnapshotLoader> = {
  products: (p, id) => p.product.findUnique({ where: { id } }),
  discounts: (p, id) => p.discountCode.findUnique({ where: { id } }),
  'farm-tours': (p, id) => p.farmTour.findUnique({ where: { id } }),
  locations: (p, id) => p.location.findUnique({ where: { id } }),
  schedules: (p, id) => p.schedule.findUnique({ where: { id } }),
  'social-posts': (p, id) => p.socialPost.findUnique({ where: { id } }),
  reviews: (p, id) => p.review.findUnique({ where: { id } }),
  orders: (p, id) =>
    p.order.findUnique({ where: { id }, select: ORDER_SNAPSHOT }),
  refunds: (p, id) =>
    p.refund.findUnique({ where: { id }, select: REFUND_SNAPSHOT }),
  users: (p, id) => p.user.findUnique({ where: { id }, select: USER_SNAPSHOT }),
  members: (p, id) =>
    p.user.findUnique({ where: { id }, select: USER_SNAPSHOT }),
  'site-settings': (p, key) => p.siteSetting.findUnique({ where: { key } }),
};

/** Actions that change an existing record, so a "before" snapshot exists. */
const SNAPSHOT_ACTIONS = new Set(['UPDATE', 'DELETE', 'STATUS_CHANGE']);

/** Fields that name a record, in order of preference. */
const LABEL_FIELDS = ['name', 'title', 'code', 'orderNumber', 'key', 'email'];

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'accessToken',
  'refreshToken',
];

/**
 * Audit Log Interceptor
 *
 * Automatically captures admin operations marked with @AuditLog decorator
 * and persists them to the audit_logs table.
 *
 * Flow:
 * 1. Before handler: for UPDATE/DELETE, snapshot the record being changed
 * 2. After handler: extract resource ID from params/response, write audit log
 *
 * Audit logging is fire-and-forget — failures are logged but never
 * block the response to the client. The snapshot query is awaited (it must
 * run before the handler), but its failure is swallowed the same way.
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

    return from(this.loadSnapshot(request, metadata)).pipe(
      switchMap((before) => {
        // Timed after the snapshot so `duration` measures the handler only
        const startTime = Date.now();
        return next.handle().pipe(
          tap((responseBody: unknown) => {
            const duration = Date.now() - startTime;

            // Fire-and-forget: don't await, don't block response
            this.writeAuditLog(
              request,
              metadata,
              responseBody,
              duration,
              before,
            ).catch((err: Error) => {
              this.logger.error(
                `Failed to write audit log: ${err.message}`,
                err.stack,
              );
            });
          }),
        );
      }),
    );
  }

  private async loadSnapshot(
    request: Request,
    metadata: AuditLogMetadata,
  ): Promise<Snapshot | null> {
    if (!SNAPSHOT_ACTIONS.has(metadata.action)) return null;
    const loader = SNAPSHOT_LOADERS[metadata.resource];
    const id = request.params[metadata.idParam || 'id'];
    if (!loader || typeof id !== 'string') return null;

    try {
      return await loader(this.prisma, id);
    } catch (err) {
      this.logger.warn(
        `Audit snapshot failed for ${metadata.resource}:${id}: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private async writeAuditLog(
    request: Request,
    metadata: AuditLogMetadata,
    responseBody: unknown,
    duration: number,
    before: Snapshot | null,
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

    // Current name first, so a rename is listed under the new name; the old
    // one stays in metadata.before. After a DELETE only `before` has it.
    const label =
      this.pickLabel(this.unwrapBody(responseBody)) ??
      this.pickLabel(request.body as Snapshot | undefined) ??
      this.pickLabel(before);

    // Image sub-routes change an image, not the parent: keep the parent's
    // name as the label but don't store a full copy of it on every upload.
    const keepBefore =
      before && !request.url.includes('/images') ? before : null;

    // Build human-readable summary
    const summary = this.buildSummary(
      metadata,
      request.method,
      resourceId,
      label,
    );

    await this.prisma.auditLog.create({
      data: {
        operatorId: user.userId,
        action: metadata.action,
        resource: metadata.resource,
        resourceId,
        summary,
        metadata: this.sanitizeMetadata(
          request,
          metadata,
          label,
          keepBefore,
        ) as object,
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
    if (metadata.action === 'CREATE') {
      const data = this.unwrapBody(responseBody);
      if (typeof data?.id === 'string') return data.id;
    }

    return null;
  }

  /** Support nested `{ data: {...} }` and flat response bodies. */
  private unwrapBody(body: unknown): Snapshot | undefined {
    if (!body || typeof body !== 'object') return undefined;
    const b = body as Snapshot;
    return b.data && typeof b.data === 'object' ? (b.data as Snapshot) : b;
  }

  private pickLabel(record: Snapshot | null | undefined): string | null {
    if (!record) return null;
    for (const field of LABEL_FIELDS) {
      const value = record[field];
      if (typeof value === 'string' && value.trim()) {
        return value.substring(0, 200);
      }
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
    label: string | null,
  ): string {
    const target = resourceId
      ? `${metadata.resource}:${resourceId}`
      : metadata.resource;
    const name = label ? ` (${label})` : '';
    return `${metadata.action} ${target}${name} via ${method}`;
  }

  private stripSensitive(record: Snapshot): Snapshot {
    return Object.fromEntries(
      Object.entries(record).filter(
        ([key]) =>
          !SENSITIVE_FIELDS.some((f) =>
            key.toLowerCase().includes(f.toLowerCase()),
          ),
      ),
    );
  }

  /**
   * Sanitize request data for storage.
   * Strips sensitive fields (passwords, tokens) from body and snapshot.
   */
  private sanitizeMetadata(
    request: Request,
    metadata: AuditLogMetadata,
    label: string | null,
    before: Snapshot | null,
  ): Record<string, unknown> {
    const sanitizedBody =
      request.body && typeof request.body === 'object'
        ? this.stripSensitive(request.body as Snapshot)
        : undefined;

    return {
      method: request.method,
      path: request.url,
      action: metadata.action,
      ...(label ? { label } : {}),
      // JSON round-trip turns Date/Decimal into plain strings for the Json column
      ...(before
        ? {
            before: JSON.parse(
              JSON.stringify(this.stripSensitive(before)),
            ) as Snapshot,
          }
        : {}),
      ...(sanitizedBody && Object.keys(sanitizedBody).length > 0
        ? { body: sanitizedBody }
        : {}),
    };
  }

  /**
   * Client IP as Cloudflare (in front of Render) saw it.
   * x-forwarded-for is forgeable and req.ip is always 127.0.0.1 behind
   * Render (see UserThrottlerGuard). Admin traffic goes through the Vercel
   * proxy, so this is usually a Vercel egress IP — the operator is
   * identified by operatorId, not by IP.
   */
  private getClientIp(request: Request): string | null {
    const cfIp = request.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp) return cfIp;
    return request.ip || null;
  }
}
