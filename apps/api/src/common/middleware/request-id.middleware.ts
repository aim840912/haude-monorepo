import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 *
 * Ensures every request has a unique correlation ID for distributed tracing.
 * - Uses incoming `x-request-id` header if present (from frontend/load balancer)
 * - Generates a new UUID if missing
 * - Attaches to response header for client-side correlation
 *
 * Works with nestjs-pino's genReqId to ensure logs include the same ID.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const requestId =
      (req.headers['x-request-id'] as string) || randomUUID();

    // Set on request for downstream access
    req.headers['x-request-id'] = requestId;

    // Echo back in response for client-side correlation
    res.setHeader('x-request-id', requestId);

    next();
  }
}
