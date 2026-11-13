import { Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Look up a readable name for audit-log targets by their resourceId.
 *
 * Used twice: when writing a log whose body/snapshot carried no name
 * (e.g. stock-alerts are keyed by productId and only send a threshold), and
 * when listing old logs that were written before labels existed. The second
 * use returns the record's *current* name, which may differ from the name it
 * had at the time — the admin UI marks it as such.
 *
 * Keyed by the resource name used in @AuditLog. Resources not listed here
 * (banners live in memory, system has no target) resolve to nothing.
 */
type LabelResolver = (
  prisma: PrismaService,
  ids: string[],
) => Promise<Array<[string, string | null]>>;

const byProductId: LabelResolver = async (p, ids) =>
  (
    await p.product.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    })
  ).map((r) => [r.id, r.name]);

// Name only — the email is personal data and the list view doesn't need it
const byUserId: LabelResolver = async (p, ids) =>
  (
    await p.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    })
  ).map((r) => [r.id, r.name]);

const LABEL_RESOLVERS: Record<string, LabelResolver> = {
  products: byProductId,
  'stock-alerts': byProductId,
  discounts: async (p, ids) =>
    (
      await p.discountCode.findMany({
        where: { id: { in: ids } },
        select: { id: true, code: true },
      })
    ).map((r) => [r.id, r.code]),
  'farm-tours': async (p, ids) =>
    (
      await p.farmTour.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })
    ).map((r) => [r.id, r.name]),
  locations: async (p, ids) =>
    (
      await p.location.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })
    ).map((r) => [r.id, r.name]),
  schedules: async (p, ids) =>
    (
      await p.schedule.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true },
      })
    ).map((r) => [r.id, r.title]),
  'social-posts': async (p, ids) =>
    (
      await p.socialPost.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true },
      })
    ).map((r) => [r.id, r.title]),
  reviews: async (p, ids) =>
    (
      await p.review.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true },
      })
    ).map((r) => [r.id, r.title]),
  orders: async (p, ids) =>
    (
      await p.order.findMany({
        where: { id: { in: ids } },
        select: { id: true, orderNumber: true },
      })
    ).map((r) => [r.id, r.orderNumber]),
  // A refund has no name of its own; the order number is what admins search by
  refunds: async (p, ids) =>
    (
      await p.refund.findMany({
        where: { id: { in: ids } },
        select: { id: true, order: { select: { orderNumber: true } } },
      })
    ).map((r) => [r.id, r.order.orderNumber]),
  users: byUserId,
  members: byUserId,
  // Addressed by key, and the key already is the readable name — no query,
  // and never "missing", so a deleted setting still shows its key
  'site-settings': (_p, keys) =>
    Promise.resolve(keys.map((key): [string, string] => [key, key])),
};

const logger = new Logger('AuditLabels');

/**
 * Resolve names for many ids of one resource in a single query.
 *
 * - `null`  → unknown: no resolver for this resource, or the query failed.
 *             Callers must not read this as "the target was deleted".
 * - a Map   → every id that still exists is a key; its value is the name,
 *             or null when the record exists but has no usable name.
 *             An id missing from the Map means the record is gone.
 *
 * Never throws: a failed lookup only means the log shows its id.
 */
export async function resolveAuditLabels(
  prisma: PrismaService,
  resource: string,
  ids: string[],
): Promise<Map<string, string | null> | null> {
  // Own keys only: `in` would also match Object.prototype ("constructor"…)
  if (!Object.hasOwn(LABEL_RESOLVERS, resource)) return null;
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  try {
    const rows = await LABEL_RESOLVERS[resource](prisma, unique);
    return new Map(rows.map(([id, name]) => [id, name?.trim() ? name : null]));
  } catch (err) {
    logger.warn(
      `Label lookup failed for ${resource}: ${(err as Error).message}`,
    );
    return null;
  }
}
