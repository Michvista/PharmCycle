const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Real Nigerian cities with approximate coordinates - lets geolocation/nearby
// search demo convincingly (e.g. Lagos pharmacies cluster near each other,
// Abuja/Port Harcourt/Ibadan are clearly "far" from Lagos).
const PHARMACIES = [
  { name: 'GreenLife Pharmacy', address: '14 Adeola Odeku St', city: 'Lagos', state: 'Lagos', lat: 6.4281, lng: 3.4219 },
  { name: 'LifeCare Pharmacy', address: '22 Allen Avenue', city: 'Lagos', state: 'Lagos', lat: 6.6018, lng: 3.3515 },
  { name: 'MedPlus Pharmacy', address: '5 Awolowo Road', city: 'Lagos', state: 'Lagos', lat: 6.5965, lng: 3.3811 },
  { name: 'HealthPlus Pharmacy', address: '10 Ring Road', city: 'Ibadan', state: 'Oyo', lat: 7.3775, lng: 3.9470 },
  { name: 'CityCare Pharmacy', address: '8 Wuse Zone 2', city: 'Abuja', state: 'FCT', lat: 9.0579, lng: 7.4951 },
  { name: 'GoodHealth Pharmacy', address: '3 Aba Road', city: 'Port Harcourt', state: 'Rivers', lat: 4.8242, lng: 7.0336 },
  { name: 'Trust Pharmacy', address: '17 Zaria Road', city: 'Kano', state: 'Kano', lat: 12.0022, lng: 8.5919 },
  { name: 'WellCare Pharmacy', address: '6 New Market Road', city: 'Onitsha', state: 'Anambra', lat: 6.1450, lng: 6.7853 },
];

const MEDICINES = [
  { name: 'Paracetamol', category: 'Analgesic', dosageForm: 'Tablet', strength: '500mg' },
  { name: 'Amoxicillin', category: 'Antibiotic', dosageForm: 'Capsule', strength: '500mg' },
  { name: 'Cetirizine', category: 'Antihistamine', dosageForm: 'Tablet', strength: '10mg' },
  { name: 'Azithromycin', category: 'Antibiotic', dosageForm: 'Tablet', strength: '500mg' },
  { name: 'Artemether/Lumefantrine', category: 'Antimalarial', dosageForm: 'Tablet', strength: '80/480mg' },
  { name: 'Metformin', category: 'Antidiabetic', dosageForm: 'Tablet', strength: '500mg' },
  { name: 'Ibuprofen', category: 'Analgesic', dosageForm: 'Tablet', strength: '400mg' },
  { name: 'Omeprazole', category: 'Antacid', dosageForm: 'Capsule', strength: '20mg' },
  { name: 'Ciprofloxacin', category: 'Antibiotic', dosageForm: 'Tablet', strength: '500mg' },
  { name: 'Coartem', category: 'Antimalarial', dosageForm: 'Tablet', strength: '20/120mg' },
  { name: 'Vitamin C', category: 'Supplement', dosageForm: 'Tablet', strength: '1000mg' },
  { name: 'ORS (Oral Rehydration Salts)', category: 'Electrolyte', dosageForm: 'Sachet', strength: '20.5g' },
];

function randomDateWithinDays(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Seeding database...');

  // Clean slate (order matters due to FK constraints)
  await prisma.notification.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.transferRequest.deleteMany();
  await prisma.transferListing.deleteMany();
  await prisma.salesRecord.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.consumer.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.pharmacy.deleteMany();

  // Create medicines
  const medicines = [];
  for (const m of MEDICINES) {
    const medicine = await prisma.medicine.create({ data: m });
    medicines.push(medicine);
  }
  console.log(`Created ${medicines.length} medicines`);

  // Create pharmacies + one admin user each (password for ALL demo accounts: "password123")
  const hashedPassword = await bcrypt.hash('password123', 10);
  const pharmacies = [];

  for (const p of PHARMACIES) {
    const pharmacy = await prisma.pharmacy.create({
      data: {
        ...p,
        verified: true,
        users: {
          create: {
            name: `${p.name} Admin`,
            email: `${p.name.toLowerCase().replace(/\s+/g, '')}@demo.com`,
            password: hashedPassword,
            role: 'ADMIN',
          },
        },
      },
    });
    pharmacies.push(pharmacy);
  }
  console.log(`Created ${pharmacies.length} pharmacies (login: <pharmacyname>@demo.com / password123)`);

  // Create inventory items per pharmacy - mix of healthy, near-expiry, low-stock, out-of-stock
  const inventoryItems = [];

  for (const pharmacy of pharmacies) {
    for (const medicine of medicines) {
      // Not every pharmacy stocks every medicine - ~80% chance
      if (Math.random() > 0.8) continue;

      const roll = Math.random();
      let quantity, expiryDate;

      if (roll < 0.15) {
        // near expiry, decent quantity (classic "redistribute before it expires" case)
        quantity = randomInt(50, 400);
        expiryDate = randomDateWithinDays(randomInt(3, 28));
      } else if (roll < 0.25) {
        // low stock
        quantity = randomInt(1, 45);
        expiryDate = randomDateWithinDays(randomInt(120, 400));
      } else if (roll < 0.3) {
        // out of stock
        quantity = 0;
        expiryDate = randomDateWithinDays(randomInt(120, 400));
      } else {
        // healthy
        quantity = randomInt(100, 600);
        expiryDate = randomDateWithinDays(randomInt(60, 500));
      }

      const costPrice = randomInt(300, 1500);
      const sellingPrice = Math.round(costPrice * 1.4);

      let status;
      const daysToExpiry = Math.ceil((expiryDate - new Date()) / 86400000);
      if (quantity <= 0) status = 'OUT_OF_STOCK';
      else if (daysToExpiry <= 30) status = 'NEAR_EXPIRY';
      else if (quantity <= 50) status = 'LOW_STOCK';
      else status = 'HEALTHY';

      const item = await prisma.inventoryItem.create({
        data: {
          pharmacyId: pharmacy.id,
          medicineId: medicine.id,
          quantity,
          costPrice,
          sellingPrice,
          batchNumber: `BN${randomInt(10000, 99999)}`,
          expiryDate,
          status,
        },
      });
      inventoryItems.push(item);
    }
  }
  console.log(`Created ${inventoryItems.length} inventory items`);

  // Create transfer listings for near-expiry items (the core "exchange" feature)
  const nearExpiryItems = inventoryItems.filter((i) => i.status === 'NEAR_EXPIRY');
  let listingsCreated = 0;

  for (const item of nearExpiryItems.slice(0, Math.ceil(nearExpiryItems.length * 0.6))) {
    await prisma.transferListing.create({
      data: {
        inventoryItemId: item.id,
        pharmacyId: item.pharmacyId,
        quantity: Math.min(item.quantity, randomInt(20, item.quantity)),
        discountPercent: randomInt(10, 40),
        status: 'AVAILABLE',
      },
    });
    listingsCreated++;
  }
  console.log(`Created ${listingsCreated} transfer listings`);

  // Create 90 days of synthetic sales records per pharmacy/medicine (for demand forecast insight)
  let salesCreated = 0;
  for (const pharmacy of pharmacies) {
    for (const medicine of medicines) {
      if (Math.random() > 0.7) continue; // not every pharmacy has sales history for every drug

      for (let daysAgo = 0; daysAgo < 90; daysAgo += randomInt(2, 6)) {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        await prisma.salesRecord.create({
          data: {
            pharmacyId: pharmacy.id,
            medicineId: medicine.id,
            quantitySold: randomInt(1, 25),
            date,
          },
        });
        salesCreated++;
      }
    }
  }
  console.log(`Created ${salesCreated} sales records`);

  // Create a few demo consumers
  const consumerPassword = await bcrypt.hash('password123', 10);
  await prisma.consumer.createMany({
    data: [
      { name: 'Chidinma Okafor', email: 'chidinma@demo.com', password: consumerPassword, city: 'Lagos', state: 'Lagos', lat: 6.5244, lng: 3.3792 },
      { name: 'Tunde Bello', email: 'tunde@demo.com', password: consumerPassword, city: 'Ibadan', state: 'Oyo', lat: 7.3775, lng: 3.9470 },
    ],
  });
  console.log('Created 2 demo consumers (login: chidinma@demo.com / password123)');

  console.log('\nSeed complete! Run "node src/jobs/expiryCheck.job.js" equivalent is handled automatically on server start.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
