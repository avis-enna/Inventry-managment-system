import express from 'express';
import { authenticate, requireInventoryOrAdmin, requireAnyRole } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all products (All roles can view products)
router.get('/', authenticate, requireAnyRole, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get product by ID (All roles can view products)
router.get('/:id', authenticate, requireAnyRole, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product retrieved successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create new product (Inventory and Admin only)
router.post('/', authenticate, requireInventoryOrAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      sku,
      unitPrice,
      costPrice,
      quantity,
      minStockLevel,
      maxStockLevel,
      categoryId,
      supplierId,
    } = req.body;

    // Validate required fields
    if (!name || !sku || !unitPrice || !categoryId || !supplierId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, sku, unitPrice, categoryId, supplierId',
      });
    }

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this SKU already exists',
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        sku,
        unitPrice: parseFloat(unitPrice),
        costPrice: parseFloat(costPrice) || parseFloat(unitPrice) * 0.7,
        quantity: parseInt(quantity) || 0,
        minStockLevel: parseInt(minStockLevel) || 0,
        maxStockLevel: parseInt(maxStockLevel) || 100,
        categoryId,
        supplierId,
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Update product (Inventory and Admin only)
router.put('/:id', authenticate, requireInventoryOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      sku,
      unitPrice,
      costPrice,
      quantity,
      minStockLevel,
      maxStockLevel,
      categoryId,
      supplierId,
    } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Check if SKU is being changed and if it conflicts
    if (sku && sku !== existingProduct.sku) {
      const skuConflict = await prisma.product.findUnique({
        where: { sku },
      });

      if (skuConflict) {
        return res.status(400).json({
          success: false,
          message: 'Product with this SKU already exists',
        });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(sku && { sku }),
        ...(unitPrice && { unitPrice: parseFloat(unitPrice) }),
        ...(costPrice && { costPrice: parseFloat(costPrice) }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(minStockLevel !== undefined && { minStockLevel: parseInt(minStockLevel) }),
        ...(maxStockLevel !== undefined && { maxStockLevel: parseInt(maxStockLevel) }),
        ...(categoryId && { categoryId }),
        ...(supplierId && { supplierId }),
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete product
// Delete product (Inventory and Admin only)
router.delete('/:id', authenticate, requireInventoryOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
