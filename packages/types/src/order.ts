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

export type PaymentMethod = 'CREDIT' | 'VACC' | 'CVS' | 'WEBATM' | 'STORE_CONTACT'

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
  payment?: OrderPayment | null
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

// API 回傳的付款資訊（嵌套在 order.payment）
export interface OrderPayment {
  id: string
  status: string
  paymentType?: string
  bankCode?: string
  vaAccount?: string
  paymentCode?: string
  expireDate?: string
  payTime?: string
}

export interface PaymentLog {
  id: string
  orderId?: string
  tradeNo?: string
  merchantOrderNo?: string
  status: string
  message?: string
  amount: number
  paymentType?: string
  bankCode?: string
  rawData?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
}

export interface PaymentFormData {
  paymentUrl: string
  merchantId: string
  merchantOrderNo: string
  tradeInfo: string
  tradeSha: string
  version: string
}
