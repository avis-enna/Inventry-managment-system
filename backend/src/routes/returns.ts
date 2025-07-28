import express from 'express';
import { authenticate, requireSalesOrAdmin, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { ReturnStatus, UserRole } from '@prisma/client';
import { transactionLogger } from '../utils/transactionLogger';

const router = express.Router();

/**
 * @swagger
 * /api/returns:
 *   get:
 *     summary: Get return requests
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: Return requests retrieved successfully
 */
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { status } = req.query;
  const user = req.user!;

  let whereClause: any = {};

  // Sales people can only see their own return requests
  if (user.role === UserRole.SALES) {
    whereClause.requestedBy = user.id;
  }

  // Filter by status if provided
  if (status && Object.values(ReturnStatus).includes(status as ReturnStatus)) {
    whereClause.status = status;
  }

  const returnRequests = await prisma.returnRequest.findMany({
    where: whereClause,
    include: {
      sale: {
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
        },
      },
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      returnItems: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    success: true,
    message: 'Return requests retrieved successfully',
    data: returnRequests,
  });
}));

/**
 * @swagger
 * /api/returns:
 *   post:
 *     summary: Create return request (Sales person only)
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - saleId
 *               - reason
 *               - items
 *             properties:
 *               saleId:
 *                 type: string
 *               reason:
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
 *                     reason:
 *                       type: string
 *                     condition:
 *                       type: string
 *     responses:
 *       201:
 *         description: Return request created successfully
 */
router.post('/', authenticate, requireSalesOrAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { saleId, reason, items } = req.body;
  const user = req.user!;

  // Validate required fields
  if (!saleId || !reason || !items || !Array.isArray(items) || items.length === 0) {
    throw createError('Sale ID, reason, and items are required', 400);
  }

  // Check if sale exists
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      saleItems: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!sale) {
    throw createError('Sale not found', 404);
  }

  // Sales people can only create return requests for their own sales
  if (user.role === UserRole.SALES && sale.salesPersonId !== user.id) {
    throw createError('You can only create return requests for your own sales', 403);
  }

  // Validate return items
  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      throw createError('Each item must have a valid product ID and quantity', 400);
    }

    // Check if product was in the original sale
    const saleItem = sale.saleItems.find(si => si.productId === item.productId);
    if (!saleItem) {
      throw createError(`Product ${item.productId} was not in the original sale`, 400);
    }

    // Check if return quantity doesn't exceed sold quantity
    if (item.quantity > saleItem.quantity) {
      throw createError(`Return quantity for ${saleItem.product.name} cannot exceed sold quantity`, 400);
    }
  }

  // Generate return number
  const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  // Calculate total amount
  let totalAmount = 0;
  for (const item of items) {
    const saleItem = sale.saleItems.find(si => si.productId === item.productId)!;
    totalAmount += Number(saleItem.unitPrice) * item.quantity;
  }

  // Create return request
  const returnRequest = await prisma.returnRequest.create({
    data: {
      returnNumber,
      saleId,
      requestedBy: user.id,
      reason,
      totalAmount,
      returnItems: {
        create: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          reason: item.reason,
          condition: item.condition,
        })),
      },
    },
    include: {
      sale: true,
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      returnItems: {
        include: {
          product: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Return request created successfully',
    data: returnRequest,
  });
}));

/**
 * @swagger
 * /api/returns/{id}/approve:
 *   post:
 *     summary: Approve return request (Admin only)
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return request approved successfully
 */
router.post('/:id/approve', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;
  const user = req.user!;

  // Check if return request exists
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      returnItems: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!returnRequest) {
    throw createError('Return request not found', 404);
  }

  if (returnRequest.status !== ReturnStatus.PENDING) {
    throw createError('Return request has already been processed', 400);
  }

  // Update return request status
  const updatedReturnRequest = await prisma.returnRequest.update({
    where: { id },
    data: {
      status: ReturnStatus.APPROVED,
      approvedBy: user.id,
      approvedAt: new Date(),
      adminNotes,
    },
    include: {
      sale: true,
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      returnItems: {
        include: {
          product: true,
        },
      },
    },
  });

  // Update product quantities (add back to inventory)
  for (const item of returnRequest.returnItems) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        quantity: {
          increment: item.quantity,
        },
      },
    });

    // Create stock movement record
    await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        type: 'RETURN',
        quantity: item.quantity,
        previousStock: item.product.quantity,
        newStock: item.product.quantity + item.quantity,
        reference: returnRequest.returnNumber,
        notes: `Return approved: ${returnRequest.reason}`,
      },
    });
  }

  // Log return transaction for financial reporting
  try {
    await transactionLogger.logTransaction({
      type: 'RETURN',
      amount: Number(returnRequest.totalAmount),
      reference: returnRequest.returnNumber,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      details: {
        items: returnRequest.returnItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unitPrice: Number(item.product.unitPrice),
          discount: 0,
          total: Number(item.product.unitPrice) * item.quantity,
        })),
        originalSaleId: returnRequest.saleId,
        notes: adminNotes,
        status: 'APPROVED',
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });
  } catch (logError) {
    // Don't fail the approval if logging fails
    console.error('Failed to log return transaction:', logError);
  }

  res.json({
    success: true,
    message: 'Return request approved successfully',
    data: updatedReturnRequest,
  });
}));

/**
 * @swagger
 * /api/returns/{id}/reject:
 *   post:
 *     summary: Reject return request (Admin only)
 *     tags: [Returns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminNotes
 *             properties:
 *               adminNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return request rejected successfully
 */
router.post('/:id/reject', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { adminNotes } = req.body;
  const user = req.user!;

  if (!adminNotes) {
    throw createError('Admin notes are required for rejection', 400);
  }

  // Check if return request exists
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id },
  });

  if (!returnRequest) {
    throw createError('Return request not found', 404);
  }

  if (returnRequest.status !== ReturnStatus.PENDING) {
    throw createError('Return request has already been processed', 400);
  }

  // Update return request status
  const updatedReturnRequest = await prisma.returnRequest.update({
    where: { id },
    data: {
      status: ReturnStatus.REJECTED,
      approvedBy: user.id,
      approvedAt: new Date(),
      adminNotes,
    },
    include: {
      sale: true,
      requester: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      returnItems: {
        include: {
          product: true,
        },
      },
    },
  });

  res.json({
    success: true,
    message: 'Return request rejected successfully',
    data: updatedReturnRequest,
  });
}));

export default router;
