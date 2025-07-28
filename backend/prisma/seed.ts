import { PrismaClient, UserRole, ProductStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default users
  const hashedPassword = await bcrypt.hash('admin123', 12);

  await prisma.user.upsert({
    where: { email: 'admin@inventory.com' },
    update: {},
    create: {
      email: 'admin@inventory.com',
      username: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      password: hashedPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: 'inventory@inventory.com' },
    update: {},
    create: {
      email: 'inventory@inventory.com',
      username: 'inventory_manager',
      firstName: 'Inventory',
      lastName: 'Manager',
      role: UserRole.INVENTORY,
      password: hashedPassword,
    },
  });

  await prisma.user.upsert({
    where: { email: 'sales@inventory.com' },
    update: {},
    create: {
      email: 'sales@inventory.com',
      username: 'sales_person',
      firstName: 'Sales',
      lastName: 'Person',
      role: UserRole.SALES,
      password: hashedPassword,
    },
  });

  console.log('✅ Users created');

  // Create categories
  const electronics = await prisma.category.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: {
      name: 'Electronics',
      description: 'Electronic devices and accessories',
    },
  });

  const clothing = await prisma.category.upsert({
    where: { name: 'Clothing' },
    update: {},
    create: {
      name: 'Clothing',
      description: 'Apparel and fashion items',
    },
  });

  const books = await prisma.category.upsert({
    where: { name: 'Books' },
    update: {},
    create: {
      name: 'Books',
      description: 'Books and educational materials',
    },
  });

  console.log('✅ Categories created');

  // Create suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'TechCorp Solutions',
      email: 'contact@techcorp.com',
      phone: '+1-555-0123',
      address: '123 Tech Street, Silicon Valley, CA 94000',
      contactPerson: 'John Smith',
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Fashion Forward Inc',
      email: 'orders@fashionforward.com',
      phone: '+1-555-0456',
      address: '456 Fashion Ave, New York, NY 10001',
      contactPerson: 'Jane Doe',
    },
  });

  console.log('✅ Suppliers created');

  // Create sample products
  const products = [
    {
      name: 'Wireless Bluetooth Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      sku: 'WBH-001',
      barcode: '1234567890123',
      categoryId: electronics.id,
      supplierId: supplier1.id,
      unitPrice: 99.99,
      costPrice: 60.00,
      quantity: 50,
      minStockLevel: 10,
      maxStockLevel: 100,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Smartphone Case',
      description: 'Protective case for smartphones',
      sku: 'SPC-001',
      barcode: '1234567890124',
      categoryId: electronics.id,
      supplierId: supplier1.id,
      unitPrice: 19.99,
      costPrice: 8.00,
      quantity: 200,
      minStockLevel: 20,
      maxStockLevel: 300,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Cotton T-Shirt',
      description: 'Comfortable cotton t-shirt in various colors',
      sku: 'CTS-001',
      barcode: '1234567890125',
      categoryId: clothing.id,
      supplierId: supplier2.id,
      unitPrice: 24.99,
      costPrice: 12.00,
      quantity: 100,
      minStockLevel: 15,
      maxStockLevel: 200,
      status: ProductStatus.ACTIVE,
    },
    {
      name: 'Programming Guide',
      description: 'Complete guide to modern programming',
      sku: 'PG-001',
      barcode: '1234567890126',
      categoryId: books.id,
      supplierId: null,
      unitPrice: 39.99,
      costPrice: 20.00,
      quantity: 30,
      minStockLevel: 5,
      maxStockLevel: 50,
      status: ProductStatus.ACTIVE,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log('✅ Products created');

  // Create sample customers
  const customers = [
    {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1-555-1001',
      address: '789 Customer St, Anytown, ST 12345',
    },
    {
      name: 'Bob Wilson',
      email: 'bob@example.com',
      phone: '+1-555-1002',
      address: '321 Buyer Ave, Somewhere, ST 54321',
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { email: customer.email },
      update: {},
      create: customer,
    });
  }

  console.log('✅ Customers created');

  // Create system settings
  const settings = [
    { key: 'company_name', value: 'Futuristic Inventory Management', type: 'STRING', category: 'GENERAL' },
    { key: 'currency', value: 'USD', type: 'STRING', category: 'GENERAL' },
    { key: 'tax_rate', value: '0.08', type: 'NUMBER', category: 'FINANCIAL' },
    { key: 'low_stock_alert', value: 'true', type: 'BOOLEAN', category: 'INVENTORY' },
    { key: 'auto_reorder', value: 'false', type: 'BOOLEAN', category: 'INVENTORY' },
    { key: 'email_notifications', value: 'true', type: 'BOOLEAN', category: 'NOTIFICATIONS' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        ...setting,
        description: `System setting for ${setting.key}`,
      },
    });
  }

  console.log('✅ System settings created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Default login credentials:');
  console.log('Admin: admin@inventory.com / admin123');
  console.log('Inventory Manager: inventory@inventory.com / admin123');
  console.log('Sales Person: sales@inventory.com / admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
