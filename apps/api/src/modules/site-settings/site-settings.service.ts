import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase';
import { UpsertSiteSettingDto } from './dto';
import { v4 as uuidv4 } from 'uuid';

// Storage bucket for site images
const SITE_IMAGES_BUCKET = 'site-images';

@Injectable()
export class SiteSettingsService {
  private readonly logger = new Logger(SiteSettingsService.name);

  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  // ========================================
  // Query Operations
  // ========================================

  /**
   * Batch fetch settings by keys (public API)
   */
  async findByKeys(keys: string[]) {
    if (!keys.length) return [];

    return this.prisma.siteSetting.findMany({
      where: { key: { in: keys } },
    });
  }

  /**
   * List all settings (admin API)
   */
  async findAll() {
    return this.prisma.siteSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get a single setting by key
   */
  async findByKey(key: string) {
    return this.prisma.siteSetting.findUnique({
      where: { key },
    });
  }

  // ========================================
  // Command Operations
  // ========================================

  /**
   * Upsert a single setting (create or update)
   */
  async upsert(key: string, dto: UpsertSiteSettingDto) {
    return this.prisma.siteSetting.upsert({
      where: { key },
      create: {
        key,
        value: dto.value,
        type: dto.type || 'string',
        description: dto.description,
      },
      update: {
        value: dto.value,
        ...(dto.type && { type: dto.type }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  // ========================================
  // Image Operations
  // ========================================

  /**
   * Get signed upload URL for site images.
   * Multi-image mode: cleanup is managed by the frontend (per-image delete).
   * Path format: {key-as-path}/{uuid}.{ext}
   * e.g. home/hero_images/abc123.jpg
   */
  async getImageUploadUrl(key: string, fileName: string) {
    // Convert dot-separated key to path: home.hero_images -> home/hero_images
    const keyPath = key.replace(/\./g, '/');
    const ext = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${uuidv4()}.${ext}`;
    const filePath = `${keyPath}/${uniqueFileName}`;

    const { signedUrl, path } = await this.supabase.createSignedUploadUrl(
      SITE_IMAGES_BUCKET,
      filePath,
    );

    const publicUrl = this.supabase.getPublicUrl(SITE_IMAGES_BUCKET, path);

    return {
      uploadUrl: signedUrl,
      filePath: path,
      publicUrl,
    };
  }

  /**
   * Delete a site image setting and its storage file
   */
  async deleteImageSetting(key: string) {
    // Clean up storage file
    await this.cleanupOldImage(key);

    // Remove setting from DB
    await this.prisma.siteSetting.deleteMany({
      where: { key },
    });

    return { deleted: true, key };
  }

  /**
   * Delete a site image from storage by file path
   */
  async deleteImage(filePath: string) {
    try {
      await this.supabase.deleteFile(SITE_IMAGES_BUCKET, filePath);
    } catch (error) {
      // Log but don't throw — storage file may not exist
      this.logger.warn(
        `Failed to delete site image from storage: ${filePath}`,
        error,
      );
    }
  }

  // ========================================
  // Private Helpers
  // ========================================

  /**
   * Extract storage file path(s) from a Supabase public URL and delete.
   * Handles both single URL strings and JSON array of URLs.
   * URL format: https://<ref>.supabase.co/storage/v1/object/public/site-images/<path>
   */
  private async cleanupOldImage(key: string) {
    try {
      const existing = await this.findByKey(key);
      if (!existing?.value) return;

      const urls = this.parseImageUrls(existing.value);

      for (const url of urls) {
        const filePath = this.extractFilePathFromUrl(url);
        if (filePath) {
          await this.deleteImage(filePath);
          this.logger.log(`Cleaned up old image for key "${key}": ${filePath}`);
        }
      }
    } catch (error) {
      // Non-blocking — old file cleanup failure should not break upload
      this.logger.warn(`Failed to cleanup old image for key "${key}"`, error);
    }
  }

  /**
   * Parse setting value as an array of image URLs.
   * Handles both JSON array format and single URL string.
   */
  private parseImageUrls(value: string): string[] {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (url: unknown) => typeof url === 'string' && (url as string).length > 0,
        );
      }
    } catch {
      // Not JSON — treat as single URL
    }
    return value ? [value] : [];
  }

  /**
   * Parse Supabase public URL to extract the storage file path
   */
  private extractFilePathFromUrl(url: string): string | null {
    // Match: /storage/v1/object/public/site-images/<path>
    const match = url.match(
      /\/storage\/v1\/object\/public\/site-images\/(.+)$/,
    );
    return match?.[1] ?? null;
  }
}
