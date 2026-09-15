# Haude Monorepo - Improvement Plan

> Generated: 2026-02-27 | Status: In Progress

---

## Current Assessment

| Area | Completion | Notes |
|------|-----------|-------|
| **Features** | 85% | Full e-commerce flow (products, cart, orders, payment, members) |
| **Admin** | 90% | 15+ pages, full CRUD, reports, CSV export |
| **API** | 80% | 19 modules, 51 DTOs, comprehensive error handling |
| **Web Frontend** | 75% | 26 routes, missing some production essentials |
| **Deployment** | 70% | CI/CD + Docker ready, lacking monitoring/logging |

---

## Phase 1: Production Gate (Week 1)

> These items BLOCK production deployment.

- [x] **1.1 Database Migrations** — Generate initial migration from existing schema ✅
  - Baseline migration created (`prisma/migrations/0_initial_schema/`)
  - 776-line SQL, marked as applied on Supabase
  - Future schema changes: `prisma migrate dev --name <description>`

- [x] **1.2 Missing Web Assets** — favicon, OG image, manifest ✅
  - `src/app/icon.svg` — SVG favicon (dynamic, tea-branded)
  - `src/app/opengraph-image.tsx` — Dynamic OG image (1200x630, auto-generated)
  - `src/app/apple-icon.tsx` — Dynamic Apple touch icon (180x180)
  - `public/manifest.webmanifest` — PWA manifest
  - Removed all 7 broken `/og-default.jpg` references

- [x] **1.3 Global Error Page** — Root error boundary for unhandled errors ✅
  - `src/app/[locale]/error.tsx` — Route-level error (within layout)
  - `src/app/global-error.tsx` — Root layout error (last resort, inline styles)
  - Consistent with existing `ErrorFallback` component design

- [ ] **1.4 Error Tracking (Sentry)** — Visibility into production errors (DEFERRED)
  - Requires Sentry account setup first
  - Install `@sentry/nextjs` (web), `@sentry/nestjs` (api), `@sentry/react` (admin)
  - Configure DSN via environment variables

- [x] **1.5 Structured Logging** — Replace console.log with proper logger ✅
  - Installed `nestjs-pino` + `pino-pretty`
  - Production: JSON format (machine-readable for log aggregation)
  - Development: Pretty print with colors
  - Auto request ID tracking (via `x-request-id` header or UUID)
  - Health check requests excluded from logging

---

## Phase 2: Stability (Week 2-3)

> Improve resilience and developer confidence.

- [x] **2.1 Per-User Rate Limiting** — Prevent single user from abusing API ✅
  - Custom `UserThrottlerGuard` extends ThrottlerGuard
  - Authenticated: rate limit by userId | Anonymous: rate limit by IP
  - Three tiers: short (3/s), medium (20/10s), long (100/min)

- [ ] **2.2 Email Queue (BullMQ)** — Async email sending, retry on failure

- [x] **2.3 Request ID Middleware** — Correlation IDs for cross-service debugging ✅
  - `RequestIdMiddleware` generates/forwards `x-request-id` header
  - Echoed back in response headers for client-side correlation
  - Included in error responses via `AllExceptionsFilter`
  - Integrated with Pino logger for structured log correlation

- [ ] **2.4 Admin E2E Tests** — Playwright tests for critical admin flows

- [x] **2.5 Product JSON-LD Schema** — Rich snippets in search results ✅
  - Already existed in `components/seo/ProductSchema.tsx`
  - Fixed broken fallback image URL

---

## Phase 3: Enhancement (Ongoing)

> Prioritize based on user feedback and business needs.

- [x] **3.1 PWA Manifest** — Mobile install capability (done in 1.2) ✅
- [x] **3.2 Audit Logging** — Track admin actions (who changed what) ✅
  - Prisma `AuditLog` model with operator, action, resource, metadata, IP
  - `@AuditLog('ACTION', 'resource')` decorator for opt-in per endpoint
  - `AuditLogInterceptor` globally registered, fire-and-forget writes
  - Applied to products, orders, site-settings admin controllers
  - Sensitive fields (password, token) automatically stripped from metadata
- [ ] **3.3 RBAC for Admin** — Granular permissions (Viewer/Editor/Admin)
- [ ] **3.4 Accessibility Audit** — WCAG AA compliance
- [ ] **3.5 Inventory Management** — Low-stock alerts, movement history

---

## What's Already Solid (No Changes Needed)

- Monorepo architecture (Turborepo + pnpm)
- TypeScript strict mode across all apps
- CI/CD 3-stage pipeline (lint → test → build)
- JWT token rotation + account lockout + Google OAuth
- Helmet + CORS + bcrypt password hashing
- Swagger API documentation (399 decorators)
- ECPay payment integration + member level system
- Web E2E tests (Playwright, 6 specs)
