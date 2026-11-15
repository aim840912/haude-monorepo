import { BadRequestException } from '@nestjs/common';

/** Same formats the admin uploaders accept (ImageManager / MultiImageUploader). */
const ALLOWED = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

/**
 * Extension for a signed-upload path, taken from the client's file name.
 *
 * The bucket is public and serves files by extension, so an unchecked
 * extension lets an uploader host e.g. `.html` or `.svg` (script-capable)
 * on the storage domain. No extension → 'jpg' (previous behavior).
 */
export function imageExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot === -1) return 'jpg';

  const ext = fileName.slice(dot + 1).toLowerCase();
  if (!ALLOWED.has(ext)) {
    throw new BadRequestException('只接受 jpg、png、webp、gif 圖片');
  }
  return ext;
}
