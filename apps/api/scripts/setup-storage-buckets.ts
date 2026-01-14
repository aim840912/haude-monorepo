/**
 * Supabase Storage Buckets 初始化腳本
 *
 * 使用方式：
 * SUPABASE_SERVICE_ROLE_KEY=your-key npx ts-node scripts/setup-storage-buckets.ts
 *
 * 或在 .env 中設定 SUPABASE_SERVICE_ROLE_KEY 後執行：
 * npx ts-node scripts/setup-storage-buckets.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// 載入環境變數
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL 未設定');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY 未設定');
  console.error('');
  console.error('請在 Supabase Dashboard 取得 service_role key：');
  console.error('Settings → API → service_role (secret)');
  console.error('');
  console.error('然後執行：');
  console.error(
    'SUPABASE_SERVICE_ROLE_KEY=your-key npx ts-node scripts/setup-storage-buckets.ts',
  );
  process.exit(1);
}

// 使用 service_role key 建立管理員權限的 client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 要建立的 buckets
const buckets = [
  {
    name: 'product-images',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  },
  {
    name: 'farm-tour-images',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  },
  {
    name: 'location-images',
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  },
];

async function setupBuckets() {
  console.log('🚀 開始建立 Storage Buckets...\n');

  for (const bucket of buckets) {
    console.log(`📦 處理 bucket: ${bucket.name}`);

    // 檢查 bucket 是否已存在
    const { data: existingBucket } = await supabase.storage.getBucket(
      bucket.name,
    );

    if (existingBucket) {
      console.log(`   ✅ 已存在，跳過\n`);
      continue;
    }

    // 建立 bucket
    const { data, error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      allowedMimeTypes: bucket.allowedMimeTypes,
      fileSizeLimit: bucket.fileSizeLimit,
    });

    if (error) {
      console.error(`   ❌ 建立失敗: ${error.message}\n`);
    } else {
      console.log(`   ✅ 建立成功\n`);
    }
  }

  console.log('✨ Storage Buckets 設定完成！');
  console.log('');
  console.log('已建立的 buckets：');
  buckets.forEach((b) => console.log(`  - ${b.name} (public: ${b.public})`));
}

setupBuckets().catch(console.error);
