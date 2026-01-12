import { IsString, IsNotEmpty, IsInt, Min } from 'class-validator'

export class ValidateDiscountDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsInt()
  @Min(0)
  subtotal: number // 訂單小計（用於驗證最低金額）
}

// 驗證結果回應
export interface DiscountValidationResult {
  valid: boolean
  discountType?: 'PERCENTAGE' | 'FIXED'
  discountValue?: number
  discountAmount?: number // 實際折扣金額
  message?: string
  code?: string
  description?: string
}
