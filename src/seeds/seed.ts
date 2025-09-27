import { PrismaClient } from "../generated/prisma/index.js";

const prisma = new PrismaClient();

// A seed script for feeding dummy data into the DB..
// Use 'npm run prisma:seed' command to execute this script..
async function main() {
  const productsData = [
    {
      name: "Reliance Industries",
      category: "Stock",
      price: 1200,
      peRatio: 25.5,
    },
    {
      name: "Apollo Tyres",
      category: "Stock",
      price: 1250,
      peRatio: 18.2,
    },
    {
      name: "TATA Mid-Cap Mutual Fund",
      category: "Mutual Fund",
      price: 1500,
      peRatio: 12.8,
    },
    {
      name: "One97 Communications",
      category: "Stock",
      price: 1300,
      peRatio: 20.0,
    },
  ];

  // Update or create products..
  for (const productData of productsData) {
    const existingProduct = await prisma.product.findFirst({
      where: { name: productData.name },
    });

    if (existingProduct) {
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: productData,
      });
    } else {
      await prisma.product.create({ data: productData });
    }
  }

  console.log("Products have been seeded!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
