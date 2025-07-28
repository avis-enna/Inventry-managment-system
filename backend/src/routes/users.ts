import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, requireAdmin, AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../index';
import { createError, asyncHandler } from '../middleware/errorHandler';
import { UserRole } from '@prisma/client';

const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/', authenticate, requireAdmin, asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: users,
  });
}));

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create new employee (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - firstName
 *               - lastName
 *               - role
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [INVENTORY, SALES]
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created successfully
 */
router.post('/', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { email, username, firstName, lastName, role, password } = req.body;

  // Validate required fields
  if (!email || !username || !firstName || !lastName || !role || !password) {
    throw createError('All fields are required', 400);
  }

  // Validate role (only INVENTORY and SALES can be created by admin)
  if (role !== UserRole.INVENTORY && role !== UserRole.SALES) {
    throw createError('Invalid role. Only INVENTORY and SALES roles can be created', 400);
  }

  // Validate password length
  if (password.length < 6) {
    throw createError('Password must be at least 6 characters long', 400);
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingEmail) {
    throw createError('Email already exists', 400);
  }

  // Check if username already exists
  const existingUsername = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  if (existingUsername) {
    throw createError('Username already exists', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      firstName,
      lastName,
      role,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Employee created successfully',
    data: user,
  });
}));

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Users]
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
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 */
router.put('/:id', authenticate, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { firstName, lastName, isActive } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw createError('User not found', 404);
  }

  // Prevent admin from deactivating themselves
  if (existingUser.role === UserRole.ADMIN && req.user!.id === id && isActive === false) {
    throw createError('Cannot deactivate your own admin account', 400);
  }

  // Update user
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(isActive !== undefined && { isActive }),
    },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user,
  });
}));

export default router;
