import { BadRequestException } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'uuid') }));

describe('SiteSettingsService.upsert link_url', () => {
  const upsert = jest.fn().mockResolvedValue({});
  const service = new SiteSettingsService(
    { siteSetting: { upsert } } as unknown as PrismaService,
    {} as SupabaseService,
  );
  const key = 'home.news.farm_activity.link_url';

  beforeEach(() => upsert.mockClear());

  it.each(['/farm-tours', '/products?category=tea', 'https://example.com/a'])(
    'accepts %s',
    async (value) => {
      await service.upsert(key, { value });
      expect(upsert).toHaveBeenCalled();
    },
  );

  it.each([
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    '//evil.example.com',
    'farm-tours',
  ])('rejects %s and writes nothing', async (value) => {
    await expect(service.upsert(key, { value })).rejects.toThrow(
      BadRequestException,
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it('leaves other keys alone', async () => {
    await service.upsert('home.news.farm_activity.title', {
      value: 'javascript: is just text here',
    });
    expect(upsert).toHaveBeenCalled();
  });
});
