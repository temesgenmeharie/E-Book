import { prisma } from "@database/client";
import { AppError } from "@/lib/errors/api-error";
import { BookStatus } from "@prisma/client";

export class CartService {
  /**
   * Retrieves the user's active shopping cart with books and prices in specified currency.
   */
  async getCart(userId: string, currency = "ETB") {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            book: {
              include: {
                prices: true,
                seller: { select: { businessName: true } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              book: {
                include: {
                  prices: true,
                  seller: { select: { businessName: true } },
                },
              },
            },
          },
        },
      });
    }

    const items = cart.items.map((item) => {
      const price =
        item.book.prices.find((p) => p.currency === currency) || item.book.prices[0];

      return {
        id: item.id,
        bookId: item.book.id,
        title: item.book.title,
        authorName: item.book.authorName,
        sellerName: item.book.seller.businessName,
        isPublished: item.book.status === BookStatus.PUBLISHED,
        currency: price?.currency || currency,
        priceAmount: price?.amount.toFixed(2) || "0.00",
      };
    });

    const totalAmount = items
      .reduce((acc, curr) => acc + parseFloat(curr.priceAmount), 0)
      .toFixed(2);

    return {
      cartId: cart.id,
      items,
      totalAmount,
      currency,
    };
  }

  /**
   * Adds a published book to user's cart.
   */
  async addItem(userId: string, bookId: string) {
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) throw AppError.notFound("Book not found");
    if (book.status !== BookStatus.PUBLISHED) {
      throw AppError.badRequest("This book is not currently available for purchase");
    }

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    return prisma.cartItem.upsert({
      where: {
        cartId_bookId: {
          cartId: cart.id,
          bookId,
        },
      },
      update: {},
      create: {
        cartId: cart.id,
        bookId,
      },
    });
  }

  /**
   * Removes an item from the cart.
   */
  async removeItem(userId: string, bookId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;

    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        bookId,
      },
    });
  }

  /**
   * Empties the user's cart.
   */
  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}

export const cartService = new CartService();

