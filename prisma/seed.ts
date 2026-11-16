import { PrismaClient, RoleType, SellerType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Seed System Roles
  const roles: { name: RoleType; description: string }[] = [
    { name: RoleType.CUSTOMER, description: "Standard marketplace reader and buyer" },
    { name: RoleType.AUTHOR, description: "Independent author publishing original digital books" },
    { name: RoleType.PUBLISHER, description: "Publishing house publishing catalog books" },
    { name: RoleType.CONTENT_MODERATOR, description: "Staff reviewing and moderating submitted books" },
    { name: RoleType.FINANCE_MANAGER, description: "Staff managing payouts, refunds, and financial ledgers" },
    { name: RoleType.ADMINISTRATOR, description: "System superuser with complete access" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: { name: role.name, description: role.description },
    });
  }
  console.log("✅ Roles seeded.");

  // 2. Seed Default Global Commission Rule (15% platform commission)
  const existingRule = await prisma.commissionRule.findFirst({
    where: { isDefault: true },
  });

  if (!existingRule) {
    await prisma.commissionRule.create({
      data: {
        rate: 0.1500,
        isDefault: true,
        effectiveStartDate: new Date("2026-01-01T00:00:00Z"),
      },
    });
    console.log("✅ Default commission rule (15%) seeded.");
  }

  // 3. Seed Default Categories
  const categories = [
    { name: "Fiction & Literature", slug: "fiction-literature", description: "Novels, short stories, and literary works" },
    { name: "Technology & Software", slug: "technology-software", description: "Computer science, programming, and architecture" },
    { name: "Business & Economics", slug: "business-economics", description: "Finance, entrepreneurship, and economics" },
    { name: "Ethiopian History & Culture", slug: "ethiopian-history-culture", description: "History, heritage, and cultural studies" },
    { name: "Self-Development", slug: "self-development", description: "Personal growth, productivity, and leadership" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { description: cat.description },
      create: cat,
    });
  }
  console.log("✅ Initial categories seeded.");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

