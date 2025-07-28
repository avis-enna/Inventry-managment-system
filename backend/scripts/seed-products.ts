import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProducts() {
  try {
    console.log('🌱 Starting to seed products...');

    // Create categories
    const categories = await Promise.all([
      prisma.category.upsert({
        where: { name: 'Electronics' },
        update: {},
        create: {
          name: 'Electronics',
          description: 'Electronic devices and components',
        },
      }),
      prisma.category.upsert({
        where: { name: 'Accessories' },
        update: {},
        create: {
          name: 'Accessories',
          description: 'Computer and electronic accessories',
        },
      }),
      prisma.category.upsert({
        where: { name: 'Software' },
        update: {},
        create: {
          name: 'Software',
          description: 'Software licenses and applications',
        },
      }),
      prisma.category.upsert({
        where: { name: 'Hardware' },
        update: {},
        create: {
          name: 'Hardware',
          description: 'Computer hardware components',
        },
      }),
    ]);

    console.log('✅ Categories created:', categories.length);

    // Create suppliers (since name is not unique, we'll check by name first)
    const suppliers = [];

    const supplierData = [
      {
        name: 'TechCorp Solutions',
        contactPerson: 'John Smith',
        email: 'john@techcorp.com',
        phone: '+1-555-0123',
        address: '123 Tech Street, Silicon Valley, CA 94000',
      },
      {
        name: 'Global Electronics',
        contactPerson: 'Sarah Johnson',
        email: 'sarah@globalelec.com',
        phone: '+1-555-0456',
        address: '456 Electronics Ave, Austin, TX 78701',
      },
      {
        name: 'Digital Innovations',
        contactPerson: 'Mike Chen',
        email: 'mike@digitalinno.com',
        phone: '+1-555-0789',
        address: '789 Innovation Blvd, Seattle, WA 98101',
      },
    ];

    for (const data of supplierData) {
      const existing = await prisma.supplier.findFirst({
        where: { name: data.name },
      });

      if (!existing) {
        const supplier = await prisma.supplier.create({ data });
        suppliers.push(supplier);
      } else {
        suppliers.push(existing);
      }
    }

    console.log('✅ Suppliers created:', suppliers.length);

    // Create products
    const products = [
      {
        name: 'Laptop Pro 15"',
        description: 'High-performance laptop with 16GB RAM and 512GB SSD',
        sku: 'LAP-PRO-15-001',
        unitPrice: 1299.99,
        costPrice: 999.99,
        quantity: 25,
        minStockLevel: 10,
        maxStockLevel: 50,
        categoryId: categories[0].id, // Electronics
        supplierId: suppliers[0].id,
      },
      {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking',
        sku: 'MOU-WIR-001',
        unitPrice: 49.99,
        costPrice: 29.99,
        quantity: 150,
        minStockLevel: 50,
        maxStockLevel: 200,
        categoryId: categories[1].id, // Accessories
        supplierId: suppliers[1].id,
      },
      {
        name: 'Mechanical Keyboard',
        description: 'RGB backlit mechanical keyboard with blue switches',
        sku: 'KEY-MEC-001',
        unitPrice: 129.99,
        costPrice: 89.99,
        quantity: 75,
        minStockLevel: 20,
        maxStockLevel: 100,
        categoryId: categories[1].id, // Accessories
        supplierId: suppliers[1].id,
      },
      {
        name: '4K Monitor 27"',
        description: 'Ultra HD 4K monitor with IPS panel',
        sku: 'MON-4K-27-001',
        unitPrice: 399.99,
        costPrice: 299.99,
        quantity: 30,
        minStockLevel: 15,
        maxStockLevel: 60,
        categoryId: categories[0].id, // Electronics
        supplierId: suppliers[0].id,
      },
      {
        name: 'Noise-Canceling Headphones',
        description: 'Premium wireless headphones with active noise cancellation',
        sku: 'HEA-NC-001',
        unitPrice: 249.99,
        costPrice: 179.99,
        quantity: 45,
        minStockLevel: 20,
        maxStockLevel: 80,
        categoryId: categories[1].id, // Accessories
        supplierId: suppliers[2].id,
      },
      {
        name: 'USB-C Hub',
        description: 'Multi-port USB-C hub with HDMI, USB 3.0, and charging',
        sku: 'HUB-USC-001',
        unitPrice: 79.99,
        costPrice: 49.99,
        quantity: 100,
        minStockLevel: 30,
        maxStockLevel: 150,
        categoryId: categories[1].id, // Accessories
        supplierId: suppliers[2].id,
      },
      {
        name: 'SSD 1TB',
        description: 'High-speed NVMe SSD with 1TB capacity',
        sku: 'SSD-1TB-001',
        unitPrice: 149.99,
        costPrice: 99.99,
        quantity: 60,
        minStockLevel: 25,
        maxStockLevel: 100,
        categoryId: categories[3].id, // Hardware
        supplierId: suppliers[0].id,
      },
      {
        name: 'Webcam HD',
        description: '1080p HD webcam with auto-focus and noise reduction',
        sku: 'CAM-HD-001',
        unitPrice: 89.99,
        costPrice: 59.99,
        quantity: 80,
        minStockLevel: 30,
        maxStockLevel: 120,
        categoryId: categories[0].id, // Electronics
        supplierId: suppliers[1].id,
      },
      {
        name: 'Office Suite License',
        description: 'Annual license for office productivity suite',
        sku: 'SW-OFF-001',
        unitPrice: 199.99,
        costPrice: 149.99,
        quantity: 200,
        minStockLevel: 50,
        maxStockLevel: 300,
        categoryId: categories[2].id, // Software
        supplierId: suppliers[2].id,
      },
      {
        name: 'Graphics Card RTX',
        description: 'High-end graphics card for gaming and professional work',
        sku: 'GPU-RTX-001',
        unitPrice: 699.99,
        costPrice: 499.99,
        quantity: 15,
        minStockLevel: 5,
        maxStockLevel: 30,
        categoryId: categories[3].id, // Hardware
        supplierId: suppliers[0].id,
      },
      {
        name: 'Wireless Charger',
        description: 'Fast wireless charging pad compatible with all devices',
        sku: 'CHG-WIR-001',
        unitPrice: 39.99,
        costPrice: 24.99,
        quantity: 120,
        minStockLevel: 40,
        maxStockLevel: 180,
        categoryId: categories[1].id, // Accessories
        supplierId: suppliers[1].id,
      },
      {
        name: 'Bluetooth Speaker',
        description: 'Portable Bluetooth speaker with 360-degree sound',
        sku: 'SPK-BT-001',
        unitPrice: 129.99,
        costPrice: 89.99,
        quantity: 65,
        minStockLevel: 25,
        maxStockLevel: 100,
        categoryId: categories[0].id, // Electronics
        supplierId: suppliers[2].id,
      },
    ];

    // Create products one by one to handle potential conflicts
    let createdProducts = 0;
    for (const productData of products) {
      try {
        const existingProduct = await prisma.product.findUnique({
          where: { sku: productData.sku },
        });

        if (!existingProduct) {
          await prisma.product.create({
            data: productData,
          });
          createdProducts++;
        } else {
          console.log(`⚠️  Product with SKU ${productData.sku} already exists, skipping...`);
        }
      } catch (error) {
        console.error(`❌ Error creating product ${productData.sku}:`, error);
      }
    }

    console.log(`✅ Products created: ${createdProducts}`);
    console.log('🎉 Seeding completed successfully!');

    // Display summary
    const totalProducts = await prisma.product.count();
    const totalCategories = await prisma.category.count();
    const totalSuppliers = await prisma.supplier.count();

    console.log('\n📊 Database Summary:');
    console.log(`   Products: ${totalProducts}`);
    console.log(`   Categories: ${totalCategories}`);
    console.log(`   Suppliers: ${totalSuppliers}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedProducts()
    .then(() => {
      console.log('✅ Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding process failed:', error);
      process.exit(1);
    });
}

export default seedProducts;
