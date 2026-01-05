import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合併 className，支援條件和 Tailwind CSS 衝突解決
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
