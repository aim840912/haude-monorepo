import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Admins pick dates in Taiwan time; convert to the UTC instant it starts. */
function startOfTaiwanDay(date: string): Date {
  return new Date(`${date}T00:00:00+08:00`);
}

const OPERATOR_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  buildWhere(query: QueryAuditLogsDto): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};
    if (query.operatorId) where.operatorId = query.operatorId;
    if (query.resource) where.resource = query.resource;
    if (query.action) where.action = query.action;

    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from ? { gte: startOfTaiwanDay(query.from) } : {}),
        // `to` is inclusive: everything before the next day starts
        ...(query.to
          ? { lt: new Date(startOfTaiwanDay(query.to).getTime() + DAY_MS) }
          : {}),
      };
    }
    return where;
  }

  async findAll(query: QueryAuditLogsDto) {
    const where = this.buildWhere(query);
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
        include: { operator: { select: OPERATOR_SELECT } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total };
  }

  /** Everyone who has at least one log entry, for the operator filter. */
  findOperators() {
    return this.prisma.user.findMany({
      where: { auditLogs: { some: {} } },
      select: OPERATOR_SELECT,
      orderBy: { name: 'asc' },
    });
  }
}
