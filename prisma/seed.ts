import { PrismaClient, RoleType, SellerType, BookStatus, BookFormat, SellerVerificationStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import Decimal from "decimal.js";

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

  const categoryMap = new Map<string, string>();
  for (const cat of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { description: cat.description },
      create: cat,
    });
    categoryMap.set(saved.slug, saved.id);
  }
  console.log("✅ Initial categories seeded.");

  // 4. Seed Superuser Administrator Account
  const adminEmail = "admin@ebookmarketplace.com";
  const adminPasswordHash = await bcrypt.hash("AdminPassword2026!", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash, isActive: true, emailVerified: true },
    create: {
      email: adminEmail,
      fullName: "Marketplace Administrator",
      passwordHash: adminPasswordHash,
      isActive: true,
      emailVerified: true,
    },
  });

  const adminRoles = [RoleType.ADMINISTRATOR, RoleType.CONTENT_MODERATOR, RoleType.FINANCE_MANAGER];
  for (const rName of adminRoles) {
    const role = await prisma.role.findUnique({ where: { name: rName } });
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: role.id } },
        update: {},
        create: { userId: adminUser.id, roleId: role.id },
      });
    }
  }
  console.log("✅ Superuser Administrator seeded (admin@ebookmarketplace.com).");

  // 5. Seed Verified Publisher Account
  const publisherEmail = "publisher@ethiobooks.com";
  const passwordHash = await bcrypt.hash("Publisher2026!", 10);

  let publisherUser = await prisma.user.findUnique({
    where: { email: publisherEmail },
    include: { sellerProfile: true },
  });

  if (!publisherUser) {
    publisherUser = await prisma.user.create({
      data: {
        email: publisherEmail,
        fullName: "Addis Ababa Digital Press",
        passwordHash,
        emailVerified: true,
      },
      include: { sellerProfile: true },
    });
  }

  const pubRole = await prisma.role.findUnique({ where: { name: RoleType.PUBLISHER } });
  if (pubRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: publisherUser.id, roleId: pubRole.id } },
      update: {},
      create: { userId: publisherUser.id, roleId: pubRole.id },
    });
  }

  let sellerProfile = publisherUser.sellerProfile;
  if (!sellerProfile) {
    sellerProfile = await prisma.sellerProfile.create({
      data: {
        userId: publisherUser.id,
        sellerType: SellerType.PUBLISHER,
        businessName: "Addis Ababa Digital Publishing House",
        bio: "Leading premier digital publishers of Ethiopian literature, technical monographs, and global educational classics.",
        websiteUrl: "https://ethiobooks.com",
        verificationStatus: SellerVerificationStatus.VERIFIED,
      },
    });
  }
  console.log("✅ Publisher account verified and seeded.");

  // 5. Seed Sample Books with High-Resolution Local SVG Covers
  const sampleBooks = [
    {
      title: "Oromay (ኦሮማይ)",
      slug: "oromay-baalu-girma",
      subtitle: "The Timeless Masterpiece of Modern Ethiopian Literature",
      authorName: "Baalu Girma",
      language: "am",
      description: "Set against the dramatic backdrop of the Red Star Campaign, Oromay is one of the most celebrated and gripping novels in Ethiopian literary history. It weaves profound human drama, military tension, and societal reflection into an unforgettable narrative.",
      coverImageKey: "/covers/oromay.svg",
      averageRating: 4.95,
      reviewCount: 142,
      categorySlug: "ethiopian-history-culture",
      etbPrice: 350.0,
      usdPrice: 9.99,
    },
    {
      title: "Designing Data-Intensive Applications",
      slug: "designing-data-intensive-applications",
      subtitle: "The Big Ideas Behind Reliable, Scalable, and Maintainable Systems",
      authorName: "Martin Kleppmann",
      language: "en",
      description: "Data is at the center of many challenges in system design today. Difficult issues need to be figured out, such as scalability, consistency, reliability, efficiency, and maintainability. This book helps software engineers navigate the diverse landscape of databases, stream processing, and distributed architectures.",
      coverImageKey: "/covers/ddia.svg",
      averageRating: 4.98,
      reviewCount: 89,
      categorySlug: "technology-software",
      etbPrice: 680.0,
      usdPrice: 19.99,
    },
    {
      title: "Fikir Eske Mekabir (ፍቅር እስከ መቃብር)",
      slug: "fikir-eske-mekabir",
      subtitle: "Love unto the Crypt — A Monumental Ethiopian Classic",
      authorName: "Haddis Alemayehu",
      language: "am",
      description: "Widely regarded as the pinnacle of Amharic prose, Fikir Eske Mekabir tells the immortal love story of Bezabih and Seblewongel. Rich with philosophical insight into feudal Ethiopian society, class dynamics, and enduring human emotion.",
      coverImageKey: "/covers/fikir-eske-mekabir.svg",
      averageRating: 4.97,
      reviewCount: 215,
      categorySlug: "fiction-literature",
      etbPrice: 420.0,
      usdPrice: 11.50,
    },
    {
      title: "Zero to One",
      slug: "zero-to-one-peter-thiel",
      subtitle: "Notes on Startups, or How to Build the Future",
      authorName: "Peter Thiel",
      language: "en",
      description: "The great secret of our time is that there are still uncharted frontiers and new inventions to create. In Zero to One, legendary entrepreneur and investor Peter Thiel shows how we can find singular ways to create new things and innovate from scratch.",
      coverImageKey: "/covers/zero-to-one.svg",
      averageRating: 4.85,
      reviewCount: 64,
      categorySlug: "business-economics",
      etbPrice: 490.0,
      usdPrice: 14.00,
    },
    {
      title: "Atomic Habits",
      slug: "atomic-habits-james-clear",
      subtitle: "An Easy & Proven Way to Build Good Habits & Break Bad Ones",
      authorName: "James Clear",
      language: "en",
      description: "No matter your goals, Atomic Habits offers a proven framework for improving every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to master tiny behaviors that lead to remarkable results.",
      coverImageKey: "/covers/atomic-habits.svg",
      averageRating: 4.92,
      reviewCount: 310,
      categorySlug: "self-development",
      etbPrice: 390.0,
      usdPrice: 10.99,
    },
    {
      title: "Clean Code",
      slug: "clean-code-robert-martin",
      subtitle: "A Handbook of Agile Software Craftsmanship",
      authorName: "Robert C. Martin",
      language: "en",
      description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. Clean Code teaches the craft of writing elegant, testable, and robust software.",
      coverImageKey: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600",
      averageRating: 4.88,
      reviewCount: 95,
      categorySlug: "technology-software",
      etbPrice: 550.0,
      usdPrice: 16.50,
    },
    {
      title: "A History of Modern Ethiopia (1855–1991)",
      slug: "history-of-modern-ethiopia-bahru-zewde",
      subtitle: "A Definitive Historical Survey",
      authorName: "Bahru Zewde",
      language: "en",
      description: "Professor Bahru Zewde's acclaimed study offers an authoritative, balanced, and deeply researched history of Ethiopia from the mid-nineteenth century to the fall of the Derg in 1991, highlighting institutional evolution, foreign encounters, and social transformations.",
      coverImageKey: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=600",
      averageRating: 4.90,
      reviewCount: 78,
      categorySlug: "ethiopian-history-culture",
      etbPrice: 450.0,
      usdPrice: 12.99,
    },
    {
      title: "Thinking, Fast and Slow",
      slug: "thinking-fast-and-slow-daniel-kahneman",
      subtitle: "How the Two Systems of the Mind Shape Our Choices",
      authorName: "Daniel Kahneman",
      language: "en",
      description: "Nobel laureate Daniel Kahneman takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think: System 1 is fast, intuitive, and emotional; System 2 is slower, more deliberative, and more logical.",
      coverImageKey: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=600",
      averageRating: 4.86,
      reviewCount: 112,
      categorySlug: "business-economics",
      etbPrice: 520.0,
      usdPrice: 15.00,
    },
  ];

  for (const b of sampleBooks) {
    const categoryId = categoryMap.get(b.categorySlug);

    const book = await prisma.book.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        subtitle: b.subtitle,
        description: b.description,
        authorName: b.authorName,
        coverImageKey: b.coverImageKey,
        status: BookStatus.PUBLISHED,
        averageRating: new Decimal(b.averageRating),
        reviewCount: b.reviewCount,
        language: b.language,
      },
      create: {
        sellerId: sellerProfile.id,
        title: b.title,
        slug: b.slug,
        subtitle: b.subtitle,
        description: b.description,
        authorName: b.authorName,
        coverImageKey: b.coverImageKey,
        status: BookStatus.PUBLISHED,
        averageRating: new Decimal(b.averageRating),
        reviewCount: b.reviewCount,
        language: b.language,
      },
    });

    // Link category
    if (categoryId) {
      await prisma.bookCategory.upsert({
        where: { bookId_categoryId: { bookId: book.id, categoryId } },
        update: {},
        create: { bookId: book.id, categoryId },
      });
    }

    // Link ETB and USD prices
    await prisma.bookPrice.upsert({
      where: { bookId_currency: { bookId: book.id, currency: "ETB" } },
      update: { amount: new Decimal(b.etbPrice) },
      create: { bookId: book.id, currency: "ETB", amount: new Decimal(b.etbPrice) },
    });

    await prisma.bookPrice.upsert({
      where: { bookId_currency: { bookId: book.id, currency: "USD" } },
      update: { amount: new Decimal(b.usdPrice) },
      create: { bookId: book.id, currency: "USD", amount: new Decimal(b.usdPrice) },
    });

    // Attach sample files (PDF & EPUB)
    await prisma.bookFile.upsert({
      where: { storageKey: `books/${book.id}/manuscript.pdf` },
      update: {},
      create: {
        bookId: book.id,
        format: BookFormat.PDF,
        storageKey: `books/${book.id}/manuscript.pdf`,
        originalName: `${b.slug}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: BigInt(4850000), // ~4.8 MB
        checksumSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        isSample: false,
      },
    });

    await prisma.bookFile.upsert({
      where: { storageKey: `books/${book.id}/manuscript.epub` },
      update: {},
      create: {
        bookId: book.id,
        format: BookFormat.EPUB,
        storageKey: `books/${book.id}/manuscript.epub`,
        originalName: `${b.slug}.epub`,
        mimeType: "application/epub+zip",
        sizeBytes: BigInt(2150000), // ~2.1 MB
        checksumSha256: "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce",
        isSample: false,
      },
    });

    console.log(` 📚 Seeded book: ${b.title} (${b.etbPrice} ETB / $${b.usdPrice})`);
  }

  console.log("🎉 Database seeding completed successfully with 8 published books!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
