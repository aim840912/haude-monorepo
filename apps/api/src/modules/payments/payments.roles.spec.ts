import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '@/common/decorators/roles.decorator';
import { AdminPaymentsController } from './payments.controller';

/**
 * Money leaves the business on these routes, so they are ADMIN-only even though
 * the rest of the admin payments controller is open to STAFF. RolesGuard uses
 * getAllAndOverride, so a handler-level @Roles replaces the class-level one.
 */
describe('AdminPaymentsController role requirements', () => {
  const reflector = new Reflector();

  const rolesFor = (handler: keyof AdminPaymentsController) =>
    reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      AdminPaymentsController.prototype[handler] as () => unknown,
      AdminPaymentsController,
    ]);

  it.each(['processRefund', 'confirmManualRefund'] as const)(
    '%s is ADMIN-only',
    (handler) => {
      expect(rolesFor(handler)).toEqual([Role.ADMIN]);
    },
  );

  it('read-only routes stay open to STAFF', () => {
    expect(rolesFor('getRefundsByPayment')).toEqual([Role.STAFF, Role.ADMIN]);
  });
});
