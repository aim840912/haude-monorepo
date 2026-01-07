import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;

  onModuleInit() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn(
        'Supabase credentials not found. Storage features will be disabled.',
      );
      return;
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Supabase client initialized');
  }

  get client(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized');
    }
    return this.supabase;
  }

  /**
   * 取得 storage 實例
   * @returns Supabase Storage client
   */
  getStorage(): SupabaseClient['storage'] {
    return this.client.storage;
  }

  /**
   * 取得 bucket 的公開 URL 前綴
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.getStorage().from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * 建立簽名上傳 URL（讓前端直傳）
   */
  async createSignedUploadUrl(
    bucket: string,
    path: string,
  ): Promise<{ signedUrl: string; path: string }> {
    const { data, error } = await this.getStorage()
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error) {
      throw new Error(`Failed to create signed upload URL: ${error.message}`);
    }

    return {
      signedUrl: data.signedUrl,
      path: data.path,
    };
  }

  /**
   * 刪除檔案
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.getStorage().from(bucket).remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * 刪除多個檔案
   */
  async deleteFiles(bucket: string, paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    const { error } = await this.getStorage().from(bucket).remove(paths);

    if (error) {
      throw new Error(`Failed to delete files: ${error.message}`);
    }
  }
}
