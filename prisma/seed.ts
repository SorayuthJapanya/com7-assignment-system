import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

const prisma = new PrismaClient({ adapter });

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  const users = [
    {
      username: "superadmin",
      password: await hash("super1234"),
      email: "superadmin@com7.th",
      nickname: "Super Admin",
      role: "SUPER_ADMIN" as const,
    },
    {
      username: "admin01",
      password: await hash("admin1234"),
      email: "admin01@com7.th",
      nickname: "Admin One",
      role: "ADMIN" as const,
    },
    {
      username: "staff01",
      password: await hash("staff1234"),
      email: "staff01@com7.th",
      nickname: "Alice Staff",
      role: "STAFF" as const,
    },
    {
      username: "staff02",
      password: await hash("staff1234"),
      email: "staff02@com7.th",
      nickname: "Bob Staff",
      role: "STAFF" as const,
    },
    {
      username: "staff03",
      password: await hash("staff1234"),
      email: "staff03@com7.th",
      nickname: "Charlie Staff",
      role: "STAFF" as const,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    });
    console.log(`✓ Seeded user: ${user.username} (${user.role})`);
  }

  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
