import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // 查詢方法（Query Operations）
  // ========================================

  /**
   * 取得用戶的購物車（包含商品詳情）
   * 如果用戶沒有購物車，會自動建立一個空的
   */
  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    // 計算總價和總數量
    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        priceUnit: item.product.priceUnit,
        stock: item.product.stock,
        image: item.product.images[0]?.storageUrl || null,
      },
      subtotal: Number(item.product.price) * item.quantity,
    }));

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      id: cart.id,
      items,
      totalItems,
      totalPrice,
    };
  }

  /**
   * 取得或建立用戶的購物車
   */
  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  orderBy: { displayPosition: 'asc' },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // 如果沒有購物車，建立一個
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    take: 1,
                    orderBy: { displayPosition: 'asc' },
                  },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  // ========================================
  // 命令方法（Command Operations）
  // ========================================

  /**
   * 新增商品到購物車
   */
  async addItem(userId: string, dto: AddCartItemDto) {
    // 1. 驗證產品存在且有庫存
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: { id: true, stock: true, reservedStock: true, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('產品不存在');
    }

    if (!product.isActive) {
      throw new BadRequestException('產品已下架');
    }

    const availableStock = product.stock - product.reservedStock;
    if (availableStock <= 0) {
      throw new BadRequestException('產品庫存不足');
    }

    // 2. 取得或建立購物車
    const cart = await this.getOrCreateCart(userId);

    // 3. 檢查是否已在購物車中
    const existingItem = cart.items.find(
      (item) => item.productId === dto.productId,
    );

    if (existingItem) {
      // 更新數量
      const newQuantity = Math.min(
        existingItem.quantity + dto.quantity,
        availableStock,
      );

      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // 新增商品
      const quantity = Math.min(dto.quantity, availableStock);

      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity,
        },
      });
    }

    // 4. 回傳更新後的購物車
    return this.getCart(userId);
  }

  /**
   * 更新購物車商品數量
   */
  async updateItemQuantity(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ) {
    // 1. 取得購物車
    const cart = await this.getOrCreateCart(userId);

    // 2. 找到對應的商品
    const cartItem = cart.items.find((item) => item.productId === productId);

    if (!cartItem) {
      throw new NotFoundException('購物車中沒有此商品');
    }

    // 3. 驗證庫存
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, reservedStock: true },
    });

    if (!product) {
      throw new NotFoundException('產品不存在');
    }

    const availableStock = product.stock - product.reservedStock;
    const newQuantity = Math.min(dto.quantity, availableStock);

    // 4. 更新數量
    await this.prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: newQuantity },
    });

    return this.getCart(userId);
  }

  /**
   * 從購物車移除商品
   */
  async removeItem(userId: string, productId: string) {
    // 1. 取得購物車
    const cart = await this.getOrCreateCart(userId);

    // 2. 找到對應的商品
    const cartItem = cart.items.find((item) => item.productId === productId);

    if (!cartItem) {
      throw new NotFoundException('購物車中沒有此商品');
    }

    // 3. 刪除商品
    await this.prisma.cartItem.delete({
      where: { id: cartItem.id },
    });

    return this.getCart(userId);
  }

  /**
   * 清空購物車
   */
  async clearCart(userId: string) {
    // 取得購物車
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return { message: '購物車已清空', items: [], totalItems: 0, totalPrice: 0 };
    }

    // 刪除所有商品
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return { message: '購物車已清空', items: [], totalItems: 0, totalPrice: 0 };
  }
}
