import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function contextFor(user?: { role?: Role }): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('denies when the endpoint declares no @Roles (fail closed)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(contextFor({ role: Role.ADMIN }))).toBe(false);
  });

  it('denies when @Roles is an empty list', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(contextFor({ role: Role.ADMIN }))).toBe(false);
  });

  it('allows a user whose role is listed', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.STAFF]);
    expect(guard.canActivate(contextFor({ role: Role.STAFF }))).toBe(true);
  });

  it('denies a user whose role is not listed', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(contextFor({ role: Role.USER }))).toBe(false);
  });

  it('denies when there is no user', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    expect(guard.canActivate(contextFor(undefined))).toBe(false);
  });
});
