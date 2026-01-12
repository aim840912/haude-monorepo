/**
 * 訂單相關型別 - 前後端共用
 */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type PaymentMethod = 'CREDIT' | 'VACC' | 'CVS' | 'WEBATM'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'expired'

export interface ShippingAddress {
  name: string
  phone: string
  street: string
  city: string
  postalCode: string
  country: string
  notes?: string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  productImage?: string
  quantity: number
  unitPrice: number
  priceUnit?: string
  unitQuantity?: number
  subtotal: number
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  status: OrderStatus
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  tax: number
  discountCode?: string
  discountAmount: number
  totalAmount: number
  shippingAddress: ShippingAddress
  paymentMethod?: PaymentMethod | string
  paymentStatus?: PaymentStatus
  paymentId?: string
  paymentTradeNo?: string
  paymentTime?: string
  paymentBankCode?: string
  paymentVaAccount?: string
  paymentExpireDate?: string
  notes?: string
  estimatedDeliveryDate?: string
  actualDeliveryDate?: string
  trackingNumber?: string
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  items: {
    productId: string
    quantity: number
  }[]
  shippingAddress: ShippingAddress
  paymentMethod?: string
  notes?: string
  discountCode?: string
}

// 折扣碼驗證結果
export interface DiscountValidation {
  valid: boolean
  discountType?: 'PERCENTAGE' | 'FIXED'
  discountValue?: number
  discountAmount?: number
  code?: string
  description?: string
  message?: string
}

export interface OrderSummary {
  totalOrders: number
  totalAmount: number
  pendingOrders: number
  processingOrders: number
  deliveredOrders: number
}

export interface OrderFilters {
  status?: OrderStatus[]
  dateFrom?: string
  dateTo?: string
  minAmount?: number
  maxAmount?: number
  userId?: string
}

export interface OrderListResponse {
  orders: Order[]
  total: number
  hasMore: boolean
  nextOffset?: number
}
