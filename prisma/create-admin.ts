import { PrismaClient, RoleType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("AdminPassword2026!", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@ebookmarketplace.com" },
    update: { passwordHash: hash, isActive: true, emailVerified: true },
    create: {
      email: "admin@ebookmarketplace.com",
      fullName: "Marketplace Administrator",
      passwordHash: hash,
      isActive: true,
      emailVerified: true,
    },
  });

  const adminRoles = [
    RoleType.ADMINISTRATOR,
    RoleType.CONTENT_MODERATOR,
    RoleType.FINANCE_MANAGER,
  ];

  for (const rName of adminRoles) {
    const role = await prisma.role.findUnique({ where: { name: rName } });
    if (role) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId: role.id } },
        update: {},
        create: { userId: user.id, roleId: role.id },
      });
    }
  }

  console.log("SUCCESS: Created administrator account admin@ebookmarketplace.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
