import { prisma } from "@database/client";
import { calculateFinancialSplit } from "@/lib/money/decimal";
import { AppError } from "@/lib/errors/api-error";
import { BookStatus, OrderStatus } from "@prisma/client";
import Decimal from "decimal.js";
import crypto from "crypto";

function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 7).replace("-", ""); // e.g. 202611
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
  return `ORD-${dateStr}-${rand}`;
}

export class OrderService {
  /**
   * Creates a pending Order with immutable item and commission snapshots from the user's cart.
   */
  async createOrderFromCart(userId: string, requestedCurrency = "ETB") {
    const currency = requestedCurrency.toUpperCase();

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            book: {
              include: {
                prices: true,
                seller: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw AppError.badRequest("Your cart is empty");
    }

    // Default system commission (15%)
    const defaultRule = await prisma.commissionRule.findFirst({
      where: { isDefault: true },
    });
    const defaultRate = defaultRule ? defaultRule.rate : new Decimal(0.15);

    // Validate all items are published and have a valid price in the requested currency
    const preparedItems = cart.items.map((item) => {
      if (item.book.status !== BookStatus.PUBLISHED) {
        throw AppError.badRequest(
          `Book "${item.book.title}" is no longer available for purchase.`
        );
      }

      const priceObj = item.book.prices.find((p) => p.currency === currency);
      if (!priceObj) {
        throw AppError.badRequest(
          `Book "${item.book.title}" is not priced in currency ${currency}.`
        );
      }

      // Check for seller-specific commission override
      const commissionRate = item.book.seller.commissionOverride ?? defaultRate;

      const split = calculateFinancialSplit(priceObj.amount, commissionRate);

      return {
        bookId: item.book.id,
        sellerId: item.book.sellerId,
        bookTitleSnapshot: item.book.title,
        authorNameSnapshot: item.book.authorName,
        priceSnapshot: split.grossAmount,
        commissionRate: split.commissionRate,
        commissionAmount: split.commissionAmount,
        sellerNetAmount: split.sellerNetAmount,
      };
    });

    const totalAmount = preparedItems.reduce(
      (sum, item) => sum.plus(item.priceSnapshot),
      new Decimal(0)
    );

    const orderNumber = generateOrderNumber();

    return prisma.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId,
          currency,
          totalAmount: totalAmount.toDecimalPlaces(2),
          status: OrderStatus.PENDING,
          items: {
            create: preparedItems.map((item) => ({
              bookId: item.bookId,
              sellerId: item.sellerId,
              bookTitleSnapshot: item.bookTitleSnapshot,
              authorNameSnapshot: item.authorNameSnapshot,
              priceSnapshot: item.priceSnapshot,
              commissionRate: item.commissionRate,
              commissionAmount: item.commissionAmount,
              sellerNetAmount: item.sellerNetAmount,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Clear Cart atomically
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    });
  }

  /**
   * Retrieves an order by ID ensuring user ownership or admin privilege.
   */
  async getOrderById(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) throw AppError.notFound("Order not found");
    if (order.userId !== userId) throw AppError.forbidden("Access denied");

    return order;
  }

  /**
   * Lists all past orders for a customer.
   */
  async getUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        payments: {
          select: { status: true, provider: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}

export const orderService = new OrderService();

