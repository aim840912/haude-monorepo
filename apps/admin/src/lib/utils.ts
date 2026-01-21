/**
 * 合併 className（簡化版）
 * 過濾 falsy 值並合併 class 字串
 */
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}
