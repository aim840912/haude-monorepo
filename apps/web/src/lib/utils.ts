import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合併 className，支援條件和 Tailwind CSS 衝突解決
 *
 * @example
 * ```tsx
 * // 基本使用
 * cn('px-2 py-1', 'text-red-500')
 *
 * // 條件 className
 * cn('base-class', isActive && 'active', isDisabled && 'disabled')
 *
 * // 物件語法
 * cn('base-class', { 'active': isActive, 'disabled': isDisabled })
 *
 * // Tailwind 衝突解決 (後者覆蓋前者)
 * cn('px-2 py-1', 'px-4') // 結果: 'py-1 px-4'
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
