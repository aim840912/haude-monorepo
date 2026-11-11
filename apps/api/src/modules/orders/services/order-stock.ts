import { Prisma } from '@prisma/client';

type OrderStockItem = { productId: string; quantity: number };

/**
 * Put a cancelled order's items back into stock.
 *
 * Every cancel path (user cancel, payment expiry, admin status change) calls
 * this inside the same transaction as a *status-conditional* order update, and
 * only when that update actually matched. That condition is what stops two
 * paths cancelling the same order at once from restocking it twice.
 */
export async function restoreOrderStock(
  tx: Prisma.TransactionClient,
  items: readonly OrderStockItem[],
): Promise<void> {
  // Fixed lock order: two transactions restocking overlapping products
  // cannot deadlock each other.
  const sorted = [...items].sort((a, b) =>
    a.productId.localeCompare(b.productId),
  );
  for (const item of sorted) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}
