import express from 'express';
import { authenticate, requireSalesOrAdmin, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';
import { transactionLogger } from '../utils/transactionLogger';

const router = express.Router();

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get sales records
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Sales retrieved successfully
 */
router.get('/', authenticate, requireSalesOrAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { page = 1, limit = 20 } = req.query;
  const user = req.user!;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  let whereClause: any = {};

  // Sales people can only see their own sales
  if (user.role === UserRole.SALES) {
    whereClause.salesPersonId = user.id;
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where: whereClause,
      include: {
        salesPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        customer: true,
        saleItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    }),
    prisma.sale.count({ where: whereClause }),
  ]);

  res.json({
    success: true,
    message: 'Sales retrieved successfully',
    data: {
      sales,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
}));

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Create new sale (POS)
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - paymentMethod
 *             properties:
 *               customerId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     discount:
 *                       type: number
 *               discount:
 *                 type: number
 *               tax:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sale created successfully
 */
router.post('/', authenticate, requireSalesOrAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { customerId, items, discount = 0, tax = 0, paymentMethod, notes } = req.body;
  const user = req.user!;

  // Validate required fields
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw createError('Items are required', 400);
  }

  if (!paymentMethod) {
    throw createError('Payment method is required', 400);
  }

  // Validate and calculate totals
  let totalAmount = 0;
  const saleItems = [];

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      throw createError('Each item must have a valid product ID and quantity', 400);
    }

    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      throw createError(`Product ${item.productId} not found`, 404);
    }

    if (product.quantity < item.quantity) {
      throw createError(`Insufficient stock for ${product.name}. Available: ${product.quantity}`, 400);
    }

    const itemDiscount = item.discount || 0;
    const itemTotal = (Number(product.unitPrice) * item.quantity) - itemDiscount;
    totalAmount += itemTotal;

    saleItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: product.unitPrice,
      discount: itemDiscount,
      total: itemTotal,
    });
  }

  const finalAmount = totalAmount - discount + tax;

  // Generate sale number
  const saleNumber = `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  // Create sale with transaction
  const sale = await prisma.$transaction(async (tx) => {
    // Create sale
    const newSale = await tx.sale.create({
      data: {
        saleNumber,
        customerId,
        salesPersonId: user.id,
        totalAmount,
        discount,
        tax,
        finalAmount,
        paymentMethod,
        notes,
        saleItems: {
          create: saleItems,
        },
      },
      include: {
        salesPerson: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        customer: true,
        saleItems: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update product quantities and create stock movements
    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      });

      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'SALE',
          quantity: -item.quantity,
          previousStock: product!.quantity,
          newStock: product!.quantity - item.quantity,
          reference: saleNumber,
          notes: `Sale to ${customerId ? 'customer' : 'walk-in'}`,
        },
      });
    }

    return newSale;
  });

  // Log transaction for financial reporting
  try {
    const totalCost = saleItems.reduce((sum, item) => {
      const product = sale.saleItems.find(si => si.productId === item.productId);
      const unitCost = product?.product?.costPrice || 0;
      return sum + (Number(unitCost) * item.quantity);
    }, 0);

    const totalProfit = finalAmount - totalCost;

    await transactionLogger.logTransaction({
      type: 'SALE',
      amount: Number(finalAmount),
      cost: totalCost,
      profit: totalProfit,
      reference: saleNumber,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      details: {
        items: sale.saleItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          unitCost: Number(item.product.costPrice || 0),
          discount: Number(item.discount),
          total: Number(item.total),
        })),
        paymentMethod,
        customerId,
        customerName: sale.customer?.name,
        notes,
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });
  } catch (logError) {
    // Don't fail the sale if logging fails
    console.error('Failed to log transaction:', logError);
  }

  res.status(201).json({
    success: true,
    message: 'Sale created successfully',
    data: sale,
  });
}));

export default router;
