import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { Roles, ROLES_KEY } from '../decorators/roles.decorator';

// RolesGuard is fail-closed: an endpoint behind it with no @Roles (on the
// method or its class) answers 403 for everyone. This test lists such
// endpoints so a forgotten @Roles fails CI instead of production.

jest.mock('uuid', () => ({ v4: jest.fn(() => 'uuid') }));

function controllerFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return controllerFiles(p);
    return name.endsWith('.controller.ts') ? [p] : [];
  });
}

const hasRolesGuard = (target: object) =>
  ((Reflect.getMetadata(GUARDS_METADATA, target) as unknown[]) ?? []).includes(
    RolesGuard,
  );

type Ctrl = { name: string; prototype: object };

function missingRoles(ctrl: Ctrl): string[] {
  const out: string[] = [];
  const classGuarded = hasRolesGuard(ctrl);
  const classRoles = Reflect.getMetadata(ROLES_KEY, ctrl) as unknown;
  for (const key of Object.getOwnPropertyNames(ctrl.prototype)) {
    if (key === 'constructor') continue;
    const handler = (ctrl.prototype as Record<string, unknown>)[key];
    if (typeof handler !== 'function') continue;
    if (Reflect.getMetadata(PATH_METADATA, handler) === undefined) continue;
    const guarded = classGuarded || hasRolesGuard(handler);
    const roles =
      (Reflect.getMetadata(ROLES_KEY, handler) as unknown) ?? classRoles;
    if (guarded && !(Array.isArray(roles) && roles.length > 0)) {
      out.push(`${ctrl.name}.${key}`);
    }
  }
  return out;
}

describe('RolesGuard coverage', () => {
  const files = controllerFiles(join(__dirname, '../../modules'));

  it('finds controllers to check', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('every endpoint behind RolesGuard declares @Roles', () => {
    const missing: string[] = [];

    for (const file of files) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const exported = require(file) as Record<string, unknown>;
      for (const value of Object.values(exported)) {
        if (typeof value !== 'function') continue;
        const ctrl = value as Ctrl;
        if (Reflect.getMetadata(PATH_METADATA, ctrl) === undefined) continue;

        missing.push(...missingRoles(ctrl));
      }
    }

    expect(missing).toEqual([]);
  });

  it('control: flags a guarded handler without @Roles', () => {
    @Controller('x')
    class Leaky {
      @Get('ok')
      @UseGuards(RolesGuard)
      @Roles(Role.ADMIN)
      ok() {}

      @Get('leak')
      @UseGuards(RolesGuard)
      leak() {}
    }
    expect(missingRoles(Leaky)).toEqual(['Leaky.leak']);
  });
});
