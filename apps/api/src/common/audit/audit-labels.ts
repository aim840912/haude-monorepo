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
  // Name only — the email is personal data and the list view doesn't need it
  users: async (p, ids) =>
    (
      await p.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })
    ).map((r) => [r.id, r.name]),
  members: async (p, ids) =>
    (
      await p.user.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true },
      })
    ).map((r) => [r.id, r.name]),
  // site-settings are addressed by key, and the key is the readable name
  'site-settings': async (p, keys) =>
    (
      await p.siteSetting.findMany({
        where: { key: { in: keys } },
        select: { key: true },
      })
    ).map((r) => [r.key, r.key]),
};

const logger = new Logger('AuditLabels');

export function hasLabelResolver(resource: string): boolean {
  // Own keys only: `in` would also match Object.prototype ("constructor"…)
  return Object.hasOwn(LABEL_RESOLVERS, resource);
}

/**
 * Resolve names for many ids of one resource in a single query.
 * Never throws: a failed lookup only means the log shows its id.
 */
export async function resolveAuditLabels(
  prisma: PrismaService,
  resource: string,
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  if (!hasLabelResolver(resource) || unique.length === 0) return new Map();
  const resolver = LABEL_RESOLVERS[resource];

  try {
    const rows = await resolver(prisma, unique);
    return new Map(
      rows.filter((row): row is [string, string] => !!row[1]?.trim()),
    );
  } catch (err) {
    logger.warn(
      `Label lookup failed for ${resource}: ${(err as Error).message}`,
    );
    return new Map();
  }
}
