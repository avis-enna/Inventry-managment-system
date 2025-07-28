import { PrismaClient, ProductType, RegulatoryStatus, ApplicationMethod, ToxicityLevel, CropType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProducts() {
  console.log('🌱 Seeding pesticide and fertilizer products...');

  // Get categories and suppliers
  const pesticideCategory = await prisma.category.findFirst({ where: { name: 'Pesticides' } });
  const fertilizerCategory = await prisma.category.findFirst({ where: { name: 'Fertilizers' } });
  const herbicideCategory = await prisma.category.findFirst({ where: { name: 'Herbicides' } });
  const fungicideCategory = await prisma.category.findFirst({ where: { name: 'Fungicides' } });
  
  const agriChemSupplier = await prisma.supplier.findFirst({ where: { name: 'AgriChem Industries' } });
  const greenGrowSupplier = await prisma.supplier.findFirst({ where: { name: 'GreenGrow Fertilizers' } });

  if (!pesticideCategory || !fertilizerCategory || !agriChemSupplier || !greenGrowSupplier) {
    throw new Error('Required categories or suppliers not found. Run main seed first.');
  }

  // Pesticide products
  const pesticideProducts = [
    {
      name: 'ChlorMax 480 EC',
      description: 'Broad-spectrum organochlorine insecticide for cotton and vegetable crops',
      sku: 'PEST-001',
      barcode: '1234567890001',
      categoryId: pesticideCategory.id,
      supplierId: agriChemSupplier.id,
      unitPrice: 45.99,
      costPrice: 32.50,
      wholesalePrice: 38.00,
      mrp: 50.00,
      quantity: 500,
      minStockLevel: 50,
      maxStockLevel: 1000,
      productType: ProductType.INSECTICIDE,
      regulatoryStatus: RegulatoryStatus.APPROVED,
      registrationNumber: 'EPA-REG-001-2024',
      activeIngredients: [
        { name: 'Chlorpyrifos', percentage: 48.0, cas: '2921-88-2' },
        { name: 'Inert ingredients', percentage: 52.0 }
      ],
      applicationMethod: ApplicationMethod.SPRAY,
      toxicityLevel: ToxicityLevel.MODERATE,
      targetCrops: [CropType.COTTON, CropType.VEGETABLES],
      applicationRate: '2-3 ml per liter of water',
      prehiInterval: 21,
      reentryInterval: 24,
      expiryDate: new Date('2026-12-31'),
      batchNumber: 'CM480-2024-001',
      manufacturingDate: new Date('2024-01-15'),
      storageConditions: 'Store in cool, dry place away from direct sunlight',
      safetyWarnings: 'Harmful if swallowed. Avoid contact with skin and eyes.',
      antidoteInfo: 'In case of poisoning, induce vomiting and seek medical attention immediately'
    },
    {
      name: 'BioKill Neem Oil',
      description: 'Organic neem-based insecticide for sustainable farming',
      sku: 'PEST-002',
      barcode: '1234567890002',
      categoryId: pesticideCategory.id,
      supplierId: agriChemSupplier.id,
      unitPrice: 28.50,
      costPrice: 20.00,
      wholesalePrice: 24.00,
      mrp: 32.00,
      quantity: 750,
      minStockLevel: 100,
      maxStockLevel: 1500,
      productType: ProductType.INSECTICIDE,
      regulatoryStatus: RegulatoryStatus.APPROVED,
      registrationNumber: 'EPA-REG-002-2024',
      activeIngredients: [
        { name: 'Azadirachtin', percentage: 1.0, cas: '11141-17-6' },
        { name: 'Neem oil', percentage: 99.0 }
      ],
      applicationMethod: ApplicationMethod.SPRAY,
      toxicityLevel: ToxicityLevel.LOW,
      targetCrops: [CropType.VEGETABLES, CropType.FRUITS, CropType.FLOWERS],
      applicationRate: '5-10 ml per liter of water',
      prehiInterval: 3,
      reentryInterval: 4,
      expiryDate: new Date('2025-08-30'),
      batchNumber: 'BK-NEEM-2024-001',
      manufacturingDate: new Date('2024-02-01'),
      storageConditions: 'Store at room temperature, protect from freezing',
      safetyWarnings: 'Generally safe for beneficial insects when used as directed',
      antidoteInfo: 'Non-toxic to humans and animals in recommended doses'
    },
    {
      name: 'WeedOut Glyphosate 41%',
      description: 'Systemic herbicide for broad-spectrum weed control',
      sku: 'HERB-001',
      barcode: '1234567890003',
      categoryId: herbicideCategory.id,
      supplierId: agriChemSupplier.id,
      unitPrice: 35.75,
      costPrice: 25.00,
      wholesalePrice: 30.00,
      mrp: 40.00,
      quantity: 400,
      minStockLevel: 40,
      maxStockLevel: 800,
      productType: ProductType.HERBICIDE,
      regulatoryStatus: RegulatoryStatus.APPROVED,
      registrationNumber: 'EPA-REG-003-2024',
      activeIngredients: [
        { name: 'Glyphosate', percentage: 41.0, cas: '1071-83-6' },
        { name: 'Surfactants and water', percentage: 59.0 }
      ],
      applicationMethod: ApplicationMethod.SPRAY,
      toxicityLevel: ToxicityLevel.MODERATE,
      targetCrops: [CropType.CEREALS, CropType.OILSEEDS, CropType.COTTON],
      applicationRate: '20-40 ml per liter of water',
      prehiInterval: 7,
      reentryInterval: 12,
      expiryDate: new Date('2027-03-15'),
      batchNumber: 'WO-GLY-2024-001',
      manufacturingDate: new Date('2024-01-10'),
      storageConditions: 'Store in original container in cool, dry place',
      safetyWarnings: 'May cause eye and skin irritation. Avoid drift to non-target plants',
      antidoteInfo: 'If ingested, do not induce vomiting. Rinse mouth and seek medical attention'
    }
  ];

  // Fertilizer products
  const fertilizerProducts = [
    {
      name: 'NPK 20-20-20 Water Soluble',
      description: 'Balanced water-soluble fertilizer for all crops',
      sku: 'FERT-001',
      barcode: '1234567890101',
      categoryId: fertilizerCategory.id,
      supplierId: greenGrowSupplier.id,
      unitPrice: 22.50,
      costPrice: 15.00,
      wholesalePrice: 18.50,
      mrp: 25.00,
      quantity: 1000,
      minStockLevel: 200,
      maxStockLevel: 2000,
      productType: ProductType.FERTILIZER,
      regulatoryStatus: RegulatoryStatus.APPROVED,
      registrationNumber: 'FERT-REG-001-2024',
      activeIngredients: [
        { name: 'Nitrogen (N)', percentage: 20.0 },
        { name: 'Phosphorus (P2O5)', percentage: 20.0 },
        { name: 'Potassium (K2O)', percentage: 20.0 },
        { name: 'Micronutrients', percentage: 2.0 },
        { name: 'Fillers', percentage: 38.0 }
      ],
      applicationMethod: ApplicationMethod.LIQUID,
      toxicityLevel: ToxicityLevel.LOW,
      targetCrops: [CropType.VEGETABLES, CropType.FRUITS, CropType.FLOWERS],
      applicationRate: '2-3 grams per liter of water',
      prehiInterval: 0,
      reentryInterval: 0,
      expiryDate: new Date('2027-12-31'),
      batchNumber: 'NPK-202020-2024-001',
      manufacturingDate: new Date('2024-03-01'),
      storageConditions: 'Store in dry place, protect from moisture',
      safetyWarnings: 'Avoid inhalation of dust. Wash hands after handling',
      antidoteInfo: 'Generally safe. If ingested in large quantities, drink water and seek medical advice'
    },
    {
      name: 'Organic Compost Fertilizer',
      description: 'Premium organic compost for soil enrichment',
      sku: 'FERT-002',
      barcode: '1234567890102',
      categoryId: fertilizerCategory.id,
      supplierId: greenGrowSupplier.id,
      unitPrice: 18.00,
      costPrice: 12.00,
      wholesalePrice: 15.00,
      mrp: 20.00,
      quantity: 800,
      minStockLevel: 100,
      maxStockLevel: 1500,
      productType: ProductType.FERTILIZER,
      regulatoryStatus: RegulatoryStatus.APPROVED,
      registrationNumber: 'ORG-FERT-001-2024',
      activeIngredients: [
        { name: 'Organic matter', percentage: 85.0 },
        { name: 'Nitrogen', percentage: 2.5 },
        { name: 'Phosphorus', percentage: 1.5 },
        { name: 'Potassium', percentage: 2.0 },
        { name: 'Moisture', percentage: 9.0 }
      ],
      applicationMethod: ApplicationMethod.BROADCAST,
      toxicityLevel: ToxicityLevel.LOW,
      targetCrops: [CropType.VEGETABLES, CropType.FRUITS, CropType.LEGUMES],
      applicationRate: '2-5 kg per square meter',
      prehiInterval: 0,
      reentryInterval: 0,
      expiryDate: new Date('2025-12-31'),
      batchNumber: 'ORG-COMP-2024-001',
      manufacturingDate: new Date('2024-02-15'),
      storageConditions: 'Store in ventilated area, protect from rain',
      safetyWarnings: 'Natural product, safe for organic farming',
      antidoteInfo: 'Non-toxic, safe for humans and animals'
    }
  ];

  // Create all products
  const allProducts = [...pesticideProducts, ...fertilizerProducts];
  
  for (const productData of allProducts) {
    await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {},
      create: productData,
    });
  }

  console.log(`✅ Created ${allProducts.length} pesticide and fertilizer products`);

  // Create customers with farming profiles
  const customers = [
    {
      name: 'Green Valley Farm',
      email: 'farmer1@example.com',
      phone: '+1-555-1001',
      address: '100 Valley Road, Green Valley, GV 33333',
      farmSize: 250.5,
      farmLocation: 'Green Valley, California',
      primaryCrops: [CropType.VEGETABLES, CropType.FRUITS],
      farmingType: 'CONVENTIONAL',
      licenseNumber: 'PL-2024-001',
      licenseExpiry: new Date('2025-12-31'),
    },
    {
      name: 'Organic Harvest Co.',
      email: 'organic.farm@example.com',
      phone: '+1-555-1002',
      address: '200 Organic Lane, Natural City, NC 44444',
      farmSize: 150.0,
      farmLocation: 'Natural City, Oregon',
      primaryCrops: [CropType.VEGETABLES, CropType.LEGUMES],
      farmingType: 'ORGANIC',
    },
    {
      name: 'Big Crop Enterprises',
      email: 'bigcrop@example.com',
      phone: '+1-555-1003',
      address: '300 Industrial Farm Rd, Mega City, MC 55555',
      farmSize: 1000.0,
      farmLocation: 'Mega City, Texas',
      primaryCrops: [CropType.CEREALS, CropType.COTTON, CropType.OILSEEDS],
      farmingType: 'CONVENTIONAL',
      licenseNumber: 'PL-2024-002',
      licenseExpiry: new Date('2025-06-30'),
    }
  ];

  for (const customerData of customers) {
    await prisma.customer.upsert({
      where: { email: customerData.email },
      update: {},
      create: customerData,
    });
  }

  console.log(`✅ Created ${customers.length} farming customers`);
}

async function main() {
  await seedProducts();
  console.log('🎉 Product seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during product seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
